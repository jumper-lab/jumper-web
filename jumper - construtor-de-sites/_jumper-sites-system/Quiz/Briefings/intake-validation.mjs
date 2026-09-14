const text = v => typeof v === 'string' && Boolean(v.trim());
const validUrl = v => {try {const u=new URL(v);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
export function validateGuidedIntake(p) {
  if (p.intake_version !== 'guided-v1') return [];
  const errors=[];
  for(const [label,value] of [['nome do negócio',p.client?.name],['descrição do negócio',p.content?.positioning?.short_description],['público',p.content?.audience?.target],['região de atuação',p.location?.city_coverage],['responsável',p.client?.contact?.responsible],['oferta principal',p.content?.conversion?.priority_offer]])if(!text(value))errors.push(`Informe ${label}.`);
  const choice=(label,value,options)=>{if(!options.includes(value))errors.push(`Confira ${label}.`);};
  choice('o objetivo do site',p.content?.conversion?.main_goal,['whatsapp','agendamento','leads','venda','autoridade','portfolio','nao-sei']);
  choice('o tipo de atendimento',p.project_scope?.business_nature,['A','B','C','D']);
  choice('o estilo desejado',p.creative_direction?.personality,['A','B','C','D','E','F','nao-sei']);
  choice('a preferência de materiais',p.assets?.availability,['link','later','existing']);
  choice('a preferência sobre imagens de IA',p.assets?.ai_placeholder_permission,['sim','nao','nao-sei']);
  choice('a preferência sobre fotos de banco',p.project_scope?.pexels_mode,['fallback','nao','nao-sei']);
  choice('o uso público dos contatos',p.operations?.contact_publication,['sim','outro','depois']);
  if(p.operations?.contact_publication==='outro'&&!text(p.operations?.public_contact))errors.push('Informe o contato público alternativo.');
  const c=p.client?.contact||{};
  if(!text(c.whatsapp)&&!text(c.email))errors.push('Informe WhatsApp ou e-mail para contato.');
  if(c.whatsapp&&(typeof c.whatsapp!=='string'||c.whatsapp.replace(/\D/g,'').length<10))errors.push('Confira o WhatsApp com DDD.');
  if(c.email&&(typeof c.email!=='string'||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)))errors.push('Confira o e-mail.');
  if(p.project_scope?.model_confirmation!==true)errors.push('Confirme o modelo e as respostas antes de enviar.');
  if(p.project_scope?.model==='M2')choice('a segunda página',p.project_scope.secondary_page,['sobre','servicos','contato','outra','nao-sei']);
  if(['A','B'].includes(p.project_scope?.business_nature))choice('a exibição do endereço',p.location?.show_address,['sim-mapa','bairro-cidade','nao-publico']);
  if(p.assets?.availability==='link'&&!validUrl(p.assets.materials_folder))errors.push('Confira o link da pasta de materiais.');
  if(p.assets?.availability==='existing'&&p.project_scope?.model!=='M5'&&!validUrl(p.assets.existing_site_url))errors.push('Confira o endereço do site com os materiais.');
  if(p.content?.conversion?.appointment_link&&!validUrl(p.content.conversion.appointment_link))errors.push('Confira o link de agendamento.');
  if(p.content?.blog?.enabled&&!['M4','M5'].includes(p.project_scope?.model))errors.push('Confira o modelo para publicação de blog.');
  if(p.location?.google_business&&!validUrl(p.location.google_business))errors.push('Confira o perfil do Google.');
  if(['strategic-v2','strategic-v3'].includes(p.briefing_depth)) {
    const c=p.content||{}, r=p.project_scope?.reformulation||{};
    const required=[['diferencial',c.positioning?.differentiator],['necessidade do público',c.audience?.typical_problem],['benefício esperado',c.audience?.typical_result],['ofertas',c.services?.items_raw],['história do negócio',c.positioning?.story],['referências visuais',p.creative_direction?.visual_references]];
    choice('a apresentação dos preços',c.services?.pricing_mode,['todos','sem-precos','misto','nao-sei']);
    choice('a ação principal',c.conversion?.primary_cta,['whatsapp','agendamento','orcamento','comprar','catalogo','servicos','nao-sei']);
    choice('a disponibilidade de avaliações',c.social_proof?.testimonials_available,['sim','nao','nao-sei']);
    if(c.social_proof?.testimonials_available==='sim') {
      required.push(['origem dos depoimentos',c.social_proof.testimonials_raw]);
      choice('a autorização dos depoimentos',c.social_proof.testimonials_permission,['nome-foto','primeiro-nome','anonimo','nao-sei']);
    }
    if(p.project_scope?.model==='M3'||p.production_handoff?.requested_modules?.gallery==='sim')required.push(['itens da galeria',c.portfolio?.items_description],['quantidade de itens',c.portfolio?.minimum_items]);
    if(c.team?.enabled)required.push(['apresentação da equipe',c.team.members_raw]);
    if(c.blog?.enabled)required.push(['temas iniciais do blog',c.blog.initial_posts_raw]);
    if(p.project_scope?.model==='M5')for(const k of ['preserve','remove','requested_pages','existing_features'])required.push(['o levantamento da reformulação',r[k]]);
    if(p.briefing_depth==='strategic-v3') {
      required.push(['exemplo do diferencial',c.positioning?.differentiator_evidence],['dúvidas dos clientes',c.audience?.questions_raw],['como funciona o atendimento ou compra',c.services?.process_raw]);
      if(p.project_scope?.model==='M2')required.push(['finalidade da segunda página',p.project_scope.secondary_page_goal]);
      if(['todos','misto'].includes(c.services?.pricing_mode))required.push(['preços e condições',c.services.pricing_details]);
    }
    for(const [label,value] of required)if(!text(value))errors.push(`Informe ${label}. Você pode indicar o que precisa de orientação.`);
  }
  return errors;
}
