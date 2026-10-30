#!/usr/bin/env python3
"""Observe one approved public Actions workflow; deliver only via VPS wrapper."""
import argparse
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path('/home/ops/workspace/beto-agents')
STATE = ROOT / 'state/00tasks/publish-watch.json'
API = 'https://api.github.com/repos/jumper-lab/jumper-web/actions'
START = '2026-10-30T00:00:00Z'
DEADLINE = '2026-11-01T03:16:00Z'
END = '2026-11-02T03:00:00Z'
SITES = 'cerrocora.izigym.com.br e www.izigym.com.br'


def fetch(path):
    req = urllib.request.Request(API + path, headers={
        'User-Agent': '00Tasks-IZI-publication-watch',
        'Accept': 'application/vnd.github+json',
    })
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)


def send(message):
    env = dict(os.environ, HERMES_HOME='/home/ops/.hermes/profiles/beto')
    result = subprocess.run(
        [str(ROOT / 'shared/send-approved-whatsapp-alert.sh'), message],
        env=env, capture_output=True, text=True, timeout=90)
    # Hermes may return zero even when the platform is unavailable.
    if result.returncode or result.stdout.strip().splitlines()[-1:] != ['sent']:
        raise RuntimeError('Gateway não confirmou envio; tentar novamente no próximo ciclo.')


def outcome(run, jobs):
    if run.get('conclusion') != 'success':
        return ('FALHA: execução terminou com ' + str(run.get('conclusion')) +
                '. A publicação pode ter sido interrompida antes ou depois do deploy. '
                'Não há rollback automático confirmado; verificar o site e os logs antes de repetir.')
    steps = [s for j in jobs for s in j.get('steps', [])]
    deploy = [s for s in steps if s.get('name') == 'Publicar IZI dev no oficial']
    if deploy and all(s.get('conclusion') == 'success' for s in deploy):
        return 'SUCESSO: o workflow concluiu build, publicação e auditoria de ' + SITES + '.'
    return 'SEM PUBLICAÇÃO CONFIRMADA: o workflow terminou, mas a etapa de publicação não executou com sucesso. Verificar os logs.'


def cycle(state, now, api=fetch, deliver=send):
    def notify(key, message):
        if key not in state['sent']:
            deliver('00Tasks — Publicação IZI Gym\n' + message)
            state['sent'].append(key)
            # Persist each confirmation immediately; later API failures cannot replay it.
            save(state)

    payload = api('/workflows/izi-official-publish.yml/runs?per_page=100')
    runs = [r for r in payload['workflow_runs'] if
            START <= r['created_at'] < END and r.get('head_branch') == 'main' and
            r.get('event') in ('schedule', 'workflow_dispatch')]
    for run in reversed(runs):
        attempt = str(run['id']) + ':' + str(run.get('run_attempt', 1))
        link = 'https://github.com/jumper-lab/jumper-web/actions/runs/' + str(int(run['id']))
        if run['status'] != 'completed':
            notify(attempt + ':started', 'Execução recebida pelo GitHub (' + run['status'] + ').\n' + link)
        elif attempt + ':completed' not in state['sent']:
            jobs = api('/runs/' + str(int(run['id'])) + '/attempts/' + str(int(run.get('run_attempt', 1))) + '/jobs?per_page=100')['jobs'] if run.get('conclusion') == 'success' else []
            notify(attempt + ':completed', outcome(run, jobs) + '\n' + link)
    if DEADLINE <= now < END and not any(r['created_at'] >= '2026-11-01T03:00:00Z' for r in runs):
        notify('schedule-delayed', 'ATENÇÃO: a execução prevista para 01/11 às 00h01 ainda não apareceu no GitHub. O agendador pode atrasar. Verificar Actions; o monitor continuará acompanhando.')


def save(state):
    temp = STATE.with_suffix('.tmp')
    temp.write_text(json.dumps(state, ensure_ascii=False))
    temp.chmod(0o600)
    temp.replace(STATE)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--test', action='store_true', help='API real + mensagem identificada de teste; sem deploy')
    args = parser.parse_args()
    STATE.parent.mkdir(parents=True, exist_ok=True)
    with STATE.with_suffix('.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = json.loads(STATE.read_text()) if STATE.exists() else {'sent': [], 'errors': 0}
        if args.test:
            fetch('/workflows/izi-official-publish.yml/runs?per_page=1')
            send('TESTE 00Tasks — ponte automática validada: o VPS consultou o workflow da IZI no GitHub e enviou este aviso pelo Hermes/Beto. Não houve deploy. O monitor avisará a conclusão ou falha mesmo com o Mac desligado.')
            print('API e envio confirmados; nenhum deploy executado.')
            return
        now = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        if now >= END and not state.get('errors'):
            return
        try:
            cycle(state, now)
            state['errors'] = 0
            state['monitor_error_sent'] = False
        except Exception:
            state['errors'] = state.get('errors', 0) + 1
            save(state)
            if state['errors'] >= 3 and not state.get('monitor_error_sent'):
                send('00Tasks — falha no monitor de publicação IZI: três consultas/envios consecutivos falharam. Verificar GitHub API e gateway no VPS; o monitor tentará novamente.')
                state['monitor_error_sent'] = True
                save(state)
            raise RuntimeError('Monitor não concluiu; detalhes sensíveis omitidos.') from None
        finally:
            save(state)


if __name__ == '__main__':
    main()
