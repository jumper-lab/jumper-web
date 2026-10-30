# Publicação IZI — revisão única

O GitHub Actions publica exclusivamente na janela de 01/11/2026, a partir de 00h01 America/Sao_Paulo. Esse é o início previsto do job; fila e build adiam a disponibilidade dos sites. O GitHub pode atrasar ou perder um disparo. O cron anual fica inofensivo após 2026 pela guarda explícita de data.

Esta PR deve permanecer aberta para revisão. Somente depois do merge seu workflow substituirá o atual. Não acione `publish` como teste: a execução manual padrão é `validate`, sem segredo Cloudflare nem chamadas de escrita. A validação de PR também não faz deploy. O workflow antigo continua no main enquanto esta PR estiver aberta; estas correções ainda não o protegem.

## Conteúdo e preservação

Planos e FAQ oficiais são sincronizados com os fontes dev (Prime R$ 187). A LP oficial é preparada a partir do snapshot versionado que corresponde à prévia atual de Vila Romana, mantendo o kit de tracking oficial. Mudanças futuras na prévia exigem nova revisão; o job não captura conteúdo mutável da internet para publicá-lo.

O manifesto `izi-official-2026-11-01.json` fixa hashes de todos os assets dos dois oficiais, HTMLs anterior/novo, código do Worker e fonte da LP. As demais páginas continuam sob comparação estrita. O overlay WordPress versionado preserva o Rodeio; as cópias dev IZI são preservadas pelo manifesto existente. Um drift de cliente/Worker/rotas/bindings bloqueia a execução. Não há upload no Worker dev nem migração de banco.

O comando autorizado permanece `npm run deploy:cloudflare -- --promote=izi-official-2026-11-01`. Compila e prepara o pacote, faz preflight, revalida versão imediatamente antes de publicar e audita depois. O relatório JSON registra fase, commit, tentativa de publicação, versão anterior e versão encontrada depois. Não há promessa de atomicidade com outro deploy concorrente.

## Falha e retry

Downloads npm têm duas novas tentativas com espera limitada. Falhas de build, hashes, permissões ou preflight interrompem o processo. Uma falha durante/depois do deploy consulta a versão ativa, registra o resultado e para; nunca repete um upload de resultado desconhecido. Não há rollback automático: uma falha depois do deploy pode deixar a nova versão ativa, e a recuperação requer revisão do artefato e da Cloudflare. Timeout/cancelamento abrupto também pode impedir o relatório; o monitor avisa o resultado terminal sem afirmar rollback.

## WhatsApp no VPS

Responsável: Leandro. `00tasks-publish-watch.timer` consulta apenas o workflow público a cada dois minutos. Não precisa de token, endpoint público, Cloudflare no VPS ou Mac ligado. Envia apenas ao destinatário fixo do wrapper `shared/send-approved-whatsapp-alert.sh`, com perfil Hermes/Beto. Não envia ao Bruno.

O monitor atualmente instalado no VPS foi autorizado e testado anteriormente; os arquivos dele são incluídos nesta PR para tornar toda a solução revisável num só lugar. Para reinstalar no VPS depois de revisão: `bash ops/izi-publish-watch/install-vps.sh`. Não executar no Mac. Teste com `python3 .../publish-watch.py --test` consulta a API real e envia mensagem identificada como teste; não publica site.

Avisos: início, sucesso da etapa de publicação, falha/cancelamento, sucesso sem publicação, atraso de disparo após 00h16 e três falhas consecutivas do monitor. Nenhum aviso de segunda tentativa interna: não há repetição cega de deploy. O estado local deduplica por execução/tentativa e só registra após `sent`. Queda entre envio e persistência pode repetir aviso. O gateway confirma aceitação do envio, não leitura pelo destinatário. Sem VPS, GitHub ou WhatsApp disponíveis, o envio não é garantido. Não há teste real de deploy nesta PR; secret Cloudflare existente ainda depende de permissões e validade na execução.
