// Shared intake contract. Missing version/type means legacy reformulation; approval is internal.
const text=v=>typeof v==='string'&&Boolean(v.trim());
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function validateM5Intake(payload) {
  if(payload?.project_scope?.model!=='M5')return [];
  const scope=payload.project_scope,errors=[];
  const modern=scope.custom_version==='m5-v2'||scope.project_type==='creation'||scope.custom!=null;
  const type=modern?scope.project_type:'reformulation';
  if(!['creation','reformulation'].includes(type))errors.push('Escolha criação ou reformulação para o M5.');
  if(scope.custom_version&&scope.custom_version!=='m5-v2')errors.push('Versão do M5 não reconhecida.');
  if(type==='reformulation'){
    const r=scope.reformulation;
    if(!object(r))errors.push('Informe os dados da reformulação M5.');
    else {
      try{const u=new URL(r.existing_site_url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();}catch{errors.push('Informe a URL http/https do site atual, sem credenciais.');}
      if(!text(r.reason))errors.push('Conte o que gostaria de melhorar no site atual.');
    }
  }
  if(modern){
    const c=scope.custom;
    if(!object(c))errors.push('Informe o escopo personalizado M5.');
    else {
      if(!['institutional','audiovisual','other'].includes(c.profile))errors.push('Escolha o perfil do site personalizado.');
      for(const [key,label]of [['requested_pages','as páginas pretendidas'],['page_details','o conteúdo de cada página'],['requested_features','os recursos solicitados']])if(!text(c[key]))errors.push(`Informe ${label} ou sinalize o que precisa de orientação.`);
      if(c.profile==='audiovisual'){
        const a=c.audiovisual;
        if(!object(a))errors.push('Informe os detalhes do portfólio audiovisual.');
        else {
          for(const [key,label]of [['home_video_count','a quantidade de vídeos'],['home_videos','os vídeos e sua ordem'],['work_credits','os trabalhos por área e créditos'],['bio_text','a Bio'],['bio_photo','a foto da Bio'],['professional_links','os links profissionais autorizados']])if(!text(a[key]))errors.push(`Informe ${label} ou indique os materiais pendentes.`);
          if(!['click','autoplay-muted','mixed','guidance'].includes(a.playback))errors.push('Escolha a reprodução dos vídeos.');
          if(a.mobile_playback&&!['poster-click','light-autoplay','guidance'].includes(a.mobile_playback))errors.push('Confira a apresentação dos vídeos no celular.');
          if(!['sim','nao','nao-sei'].includes(a.awards_available))errors.push('Informe se existem prêmios ou seleções.');
          if(a.awards_available==='sim'&&!text(a.awards_details))errors.push('Relacione prêmios, trabalhos e artes autorizadas.');
        }
      }
    }
  }
  if(scope.model_confirmation!==true)errors.push('Confirme o modelo M5.');
  return errors;
}
