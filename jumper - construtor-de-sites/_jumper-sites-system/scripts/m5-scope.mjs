import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const evidence = value => value && value.status === 'passed' && nonempty(value.evidence);
export function validateM5Scope(config, audit, delivery = false) {
  if (config?.site?.model !== 'M5') return [];
  const r = config.site.reformulation;
  const errors = [];
  if (!r || typeof r !== 'object') return ['M5: site.reformulation obrigatório.'];
  try { const u = new URL(r.existing_site_url); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw Error(); }
  catch { errors.push('M5: URL http/https do site atual obrigatória, sem credenciais.'); }
  if (r.scope_status !== 'approved' || !nonempty(r.approved_by) || !Number.isFinite(Date.parse(r.approved_at))) errors.push('M5: escopo precisa de aprovação identificada e datada.');
  if (!Array.isArray(r.pages) || !r.pages.length || r.pages.some(p => !nonempty(p.path) || !p.path.startsWith('/') || !nonempty(p.purpose))) errors.push('M5: liste as páginas finais com path e purpose.');
  else if (new Set(r.pages.map(p => p.path)).size !== r.pages.length) errors.push('M5: páginas finais duplicadas.');
  if (!Array.isArray(r.features) || r.features.some(f => !nonempty(f.name) || !nonempty(f.acceptance))) errors.push('M5: features deve listar nome e critério de aceite; [] somente se nenhum recurso foi contratado.');
  if (!Array.isArray(r.inventory) || !r.inventory.length || r.inventory.some(i => !nonempty(i.item) || !['keep','update','remove','replace'].includes(i.action) || !nonempty(i.reason))) errors.push('M5: inventário atual com item, action e reason obrigatório.');
  if (!Array.isArray(r.url_map) || !r.url_map.length || r.url_map.some(u => !nonempty(u.from) || !['keep','redirect','retire'].includes(u.action) || !nonempty(u.reason) || (u.action !== 'retire' && !nonempty(u.to)))) errors.push('M5: registre destino e justificativa dos URLs existentes.');
  if (!nonempty(r.backup_plan) || !nonempty(r.rollback_plan)) errors.push('M5: planos de backup e recuperação obrigatórios.');
  if (delivery) {
    const review = audit?.reformulation_checks;
    for (const key of ['scope', 'content', 'urls', 'integrations', 'backup', 'rollback']) {
      if (!evidence(review?.[key])) errors.push(`M5: auditoria ${key} precisa de status passed e evidência real.`);
    }
    if (!Array.isArray(review?.pages) || !r.pages?.every(p => review.pages.some(v => v.path === p.path && evidence(v)))) errors.push('M5: falta evidência de revisão de cada página contratada.');
    if (!Array.isArray(review?.features) || !r.features?.every(f => review.features.some(v => v.name === f.name && evidence(v)))) errors.push('M5: falta evidência de teste de cada funcionalidade contratada.');
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const folder = process.argv[2];
  if (!folder) { console.error('Uso: node scripts/m5-scope.mjs clientes/slug [--delivery]'); process.exit(2); }
  try {
    const config = JSON.parse(fs.readFileSync(path.join(folder, 'jumper.config.json'), 'utf8'));
    const delivery = process.argv.includes('--delivery');
    const audit = delivery ? JSON.parse(fs.readFileSync(path.join(folder, 'data/visual-quality-audit.json'), 'utf8')) : null;
    const errors = validateM5Scope(config, audit, delivery);
    console.log(errors.length ? errors.join('\n') : (config.site?.model === 'M5' ? 'M5: contrato validado. Evidências ainda exigem revisão humana/visual.' : 'Modelo diferente de M5: validação específica não aplicável.'));
    process.exitCode = errors.length ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
