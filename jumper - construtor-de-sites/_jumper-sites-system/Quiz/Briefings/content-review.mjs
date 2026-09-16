// Editorial triage only: no automatic score or automatic approval of content.
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function reviewBriefingContent(p) {
  const issues=[];
  const check=(label,value)=>{
    const s=normalize(value);
    if(!s)issues.push(`${label}: informação ausente; levantar com o cliente ou em material autorizado.`);
    else if(/nao sei|nao tenho|a confirmar|a definir|enviar depois|ser[aã]o enviad|quero (ajuda|orientacao)|preciso de (ajuda|orientacao)|jumper propon/.test(s))issues.push(`${label}: há indicação de pendência ou orientação; conferir o contexto antes de usar como conteúdo.`);
    else if(/^(qualidade|bom atendimento|excelencia|compromisso|solucoes personalizadas|atendimento personalizado)[.!\s]*$/.test(s))issues.push(`${label}: afirmação ampla; pedir um fato ou exemplo que a torne específica.`);
  };
  const c=p.content||{},scope=p.project_scope||{};
  for(const [label,value] of [['Oferta',c.services?.items_raw],['Diferencial',c.positioning?.differentiator],['Evidência do diferencial',c.positioning?.differentiator_evidence],['Necessidade do público',c.audience?.typical_problem],['Dúvidas dos clientes',c.audience?.questions_raw],['Processo de atendimento ou compra',c.services?.process_raw],['História',c.positioning?.story],['Referências visuais',p.creative_direction?.visual_references]])check(label,value);
  if(scope.model==='M2')check('Finalidade da segunda página',scope.secondary_page_goal);
  if(scope.model==='M3'||p.production_handoff?.requested_modules?.gallery==='sim')check('Conteúdo da galeria',c.portfolio?.items_description);
  if(c.team?.enabled)check('Apresentação da equipe',c.team.members_raw);
  if(c.blog?.enabled)check('Conteúdo inicial do blog',c.blog.initial_posts_raw);
  if(['todos','misto'].includes(c.services?.pricing_mode))check('Preços e condições',c.services?.pricing_details);
  if(c.conversion?.primary_cta==='agendamento'&&!c.conversion.appointment_link)issues.push('Agendamento: confirmar ferramenta, destino e limite contratado antes de publicar.');
  if(c.conversion?.primary_cta==='whatsapp'&&(p.operations?.contact_publication!=='sim'||!p.client?.contact?.whatsapp))issues.push('CTA WhatsApp: confirmar um número público autorizado; o contato privado do projeto não pode ser usado automaticamente.');
  if(c.conversion?.primary_cta==='catalogo'&&scope.model!=='M3'&&p.production_handoff?.requested_modules?.gallery!=='sim')issues.push('CTA catálogo: confirmar conteúdo e destino dentro das páginas contratadas.');
  if(c.conversion?.primary_cta==='comprar')issues.push('Compra: definir se o destino é contato, loja externa ou recurso contratado; não presumir checkout.');
  if(c.social_proof?.testimonials_available==='sim'&&c.social_proof.testimonials_permission==='nao-sei')issues.push('Depoimentos: autorização pendente; não publicar nem criar avaliações substitutas.');
  if(p.assets?.availability==='later')issues.push('Materiais reais pendentes: conferir logo, fotos, catálogo e direitos antes de substituir por imagens genéricas.');
  return {status:'needs_editorial_review',issues,rule:'Triagem não é aprovação. Confirmar fatos, resolver pendências relevantes e vincular texto, imagens e composição ao negócio real antes de construir. Não completar lacunas com frases genéricas ou fatos inventados.'};
}
