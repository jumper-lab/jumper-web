import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const evidence=v=>v&&v.status==='passed'&&nonempty(v.evidence);
export function validateM5Scope(config,audit,delivery=false){
 if(config?.site?.model!=='M5')return [];
 const site=config.site,r=site.custom_scope||site.reformulation,errors=[];
 if(!r||typeof r!=='object'||Array.isArray(r))return ['M5: contrato personalizado ou de reformulação obrigatório.'];
 const type=site.project_type||r.project_type||'reformulation';
 if(!['creation','reformulation'].includes(type))errors.push('M5: defina project_type como creation ou reformulation.');
 if(type==='creation'&&!site.custom_scope)errors.push('M5: criação deve usar site.custom_scope, sem inventário de um site inexistente.');
 if(type==='reformulation'){
  try{const u=new URL(r.existing_site_url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{errors.push('M5: URL http/https do site atual obrigatória, sem credenciais.');}
  if(!Array.isArray(r.inventory)||!r.inventory.length||r.inventory.some(i=>!nonempty(i.item)||!['keep','update','remove','replace'].includes(i.action)||!nonempty(i.reason)))errors.push('M5: inventário atual com item, action e reason obrigatório.');
  if(!Array.isArray(r.url_map)||!r.url_map.length||r.url_map.some(u=>!nonempty(u.from)||!['keep','redirect','retire'].includes(u.action)||!nonempty(u.reason)||(u.action!=='retire'&&!nonempty(u.to))))errors.push('M5: registre destino e justificativa dos URLs existentes.');
  if(!nonempty(r.backup_plan))errors.push('M5: plano de backup do site existente obrigatório.');
 }
 if(r.scope_status!=='approved'||!nonempty(r.approved_by)||!Number.isFinite(Date.parse(r.approved_at)))errors.push('M5: escopo precisa de aprovação identificada e datada.');
 if(!Array.isArray(r.pages)||!r.pages.length||r.pages.some(p=>!nonempty(p.path)||!p.path.startsWith('/')||!nonempty(p.purpose)))errors.push('M5: liste as páginas finais com path e purpose.');
 else if(new Set(r.pages.map(p=>p.path)).size!==r.pages.length)errors.push('M5: páginas finais duplicadas.');
 if(!Array.isArray(r.features)||r.features.some(f=>!nonempty(f.name)||!nonempty(f.acceptance)))errors.push('M5: features deve listar nome e critério de aceite; [] somente se nenhum recurso foi contratado.');
 if(!nonempty(r.rollback_plan))errors.push('M5: plano de recuperação da publicação obrigatório.');
 if(r.profile==='audiovisual'){
  const a=r.audiovisual;
  if(!a||!Array.isArray(a.works)||!a.works.length||a.works.some(w=>!nonempty(w.title)||!nonempty(w.source)||!nonempty(w.page)||!nonempty(w.role)||!nonempty(w.credits)))errors.push('M5 audiovisual: obras com título, fonte, página, função e créditos confirmados obrigatórias.');
  if(!Array.isArray(a?.home_videos)||!a.home_videos.length||a.home_videos.some(title=>!a.works?.some(w=>w.title===title)))errors.push('M5 audiovisual: vídeos de destaque precisam de ordem e vínculo às obras.');
  if(!['click','autoplay-muted','mixed'].includes(a?.playback)||!nonempty(a?.mobile_strategy)||!nonempty(a?.fallback_strategy))errors.push('M5 audiovisual: aprovar reprodução, celular e alternativa por capa/clique.');
  if(!nonempty(a?.bio_text)||!nonempty(a?.bio_photo)||!Array.isArray(a?.professional_links)||a.professional_links.some(l=>!nonempty(l.label)||!nonempty(l.url)))errors.push('M5 audiovisual: Bio, foto autorizada e lista de links aprovados obrigatórias.');
  if(!Array.isArray(a?.awards)||a.awards.some(item=>!nonempty(item.work)||!a.works?.some(w=>w.title===item.work)||!nonempty(item.name)||!nonempty(item.artwork)||!nonempty(item.authorization)))errors.push('M5 audiovisual: prêmios precisam de obra, identificação, arte e autorização; [] se nenhum foi aprovado.');
 }
 if(delivery){
  const review=audit?.custom_checks||audit?.reformulation_checks;
  for(const key of ['scope','content','urls','integrations','rollback',...(type==='reformulation'?['backup']:[])])if(!evidence(review?.[key]))errors.push(`M5: auditoria ${key} precisa de status passed e evidência real.`);
  if(!Array.isArray(review?.pages)||!r.pages?.every(p=>review.pages.some(v=>v.path===p.path&&evidence(v))))errors.push('M5: falta evidência de revisão de cada página contratada.');
  if(!Array.isArray(review?.features)||!r.features?.every(f=>review.features.some(v=>v.name===f.name&&evidence(v))))errors.push('M5: falta evidência de teste de cada funcionalidade contratada.');
  if(r.profile==='audiovisual')for(const key of ['media_rights','playback','mobile_performance','accessibility'])if(!evidence(review?.[key]))errors.push(`M5 audiovisual: auditoria ${key} precisa de evidência real.`);
 }
 return errors;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=process.argv[2];if(!folder){console.error('Uso: node scripts/m5-scope.mjs clientes/slug [--delivery]');process.exit(2);}
 try{const config=JSON.parse(fs.readFileSync(path.join(folder,'jumper.config.json'),'utf8'));const delivery=process.argv.includes('--delivery');const audit=delivery?JSON.parse(fs.readFileSync(path.join(folder,'data/visual-quality-audit.json'),'utf8')):null;const errors=validateM5Scope(config,audit,delivery);console.log(errors.length?errors.join('\n'):(config.site?.model==='M5'?'M5: contrato validado. Evidências ainda exigem revisão humana/visual.':'Modelo diferente de M5: validação específica não aplicável.'));process.exitCode=errors.length?1:0;}catch(error){console.error(error.message);process.exitCode=1;}
}
