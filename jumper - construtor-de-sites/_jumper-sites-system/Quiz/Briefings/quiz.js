const LEGACY_STORAGE_KEY = "jumper-studio-briefing-quiz-v2";
const STORAGE_KEY = "jumper-studio-briefing-guided-v1";
const FORM_ID = "jumper-studio-site-factory-briefing";

const models = [
  ["M1", "One Page", "Uma página com até 5 seções: apresentação, serviços, sobre, provas e contato."],
  ["M2", "Duas páginas", "Home completa com uma segunda página escolhida pelo cliente."],
  ["M3", "Portfólio ou catálogo", "Home, galeria/catálogo/portfólio e contato."],
  ["M4", "Completo local", "Home, sobre, serviços, depoimentos, blog/novidades e contato."],
  ["M5", "Reformulação institucional", "Reconstrução de um site existente, com páginas e funcionalidades definidas antes da construção."],
];

const businessNatures = [
  ["A", "Espaço físico aberto ao público"],
  ["B", "Endereço comercial com atendimento por agendamento"],
  ["C", "Atendimento no endereço do cliente"],
  ["D", "Online, delivery ou sem atendimento presencial"],
];

const personalities = [
  ["A", "Acolhedor familiar", "Próximo, humano, sensível e convidativo."],
  ["B", "Premium sofisticado", "Elegante, editorial, seletivo e refinado."],
  ["C", "Energético vibrante", "Chamativo, comercial, intenso e memorável."],
  ["D", "Técnico confiável", "Claro, preciso, organizado e seguro."],
  ["E", "Artesanal autêntico", "Tátil, autoral, natural e feito com cuidado."],
  ["F", "Moderno descolado", "Urbano, ousado, digital e contemporâneo."],
];

const initialState = {
  model: "",
  contactUse: "",
  publicContact: "",
  wantsGallery: "",
  wantsTeam: "",
  wantsBooking: "",
  materialsStatus: "",
  aiImages: "",
  hasTestimonials: "",
  reviewConfirmed: false,
  submissionId: "",
  submitted: false,
  lastStep: "model",
  legacyDraft: false,
  existingSiteUrl: "",
  reformulationReason: "",
  existingSiteProblems: "",
  preserveItems: "",
  changeItems: "",
  removeItems: "",
  addItems: "",
  requestedPages: "",
  existingFeatures: "",
  importantUrls: "",
  accessNotes: "",

  modelConfirmation: [],
  businessNature: "",
  businessName: "",
  segment: "",
  cityCoverage: "",
  contactName: "",
  whatsapp: "",
  contactEmail: "",
  instagram: "",
  phone: "",
  facebook: "",
  linkedin: "",
  foundedYear: "",
  cnpj: "",
  address: "",
  showAddress: "",
  googleBusiness: "",
  businessHours: "",
  serviceArea: "",
  shortDescription: "",
  differentiator: "",
  mustHaveMessage: "",
  story: "",
  notFor: "",
  typicalProblem: "",
  typicalResult: "",
  clientVoiceQuote: "",
  mainGoal: "",
  primaryCTA: "",
  priorityOffer: "",
  targetAudience: "",
  appointmentLink: "",
  secondaryPage: "",
  secondaryPageGoal: "",
  differentiatorEvidence: "",
  customerQuestions: "",
  serviceProcess: "",
  pricingDetails: "",
  servicesItems: "",
  pricingDisplay: "",
  promotion: "",
  teamSection: "",
  teamList: "",
  portfolioType: "",
  portfolioCategories: "",
  portfolioMinItems: "",
  portfolioPricing: "",
  portfolioItemsDescription: "",
  credibilityNumbers: "",
  googleRating: "",
  credentials: "",
  testimonials: "",
  testimonialsPermission: "",
  blogMode: "",
  blogFrequency: "",
  blogInitialPosts: "",
  blogAdminPassword: "",
  visualReferences: "",
  avoidSite: "",
  personality: "",
  voiceTone: "",
  primaryColor: "",
  secondaryColors: "",
  forbiddenWords: "",
  visualPreference: "",
  animationPreference: "",
  brandManualLink: "",
  materialsFolder: "",
  logoLink: "",
  heroImageLink: "",
  additionalImages: {},
  ownerPhotosFolder: "",
  locationPhotosFolder: "",
  teamPhotosFolder: "",
  servicesPhotosFolder: "",
  galleryFolder: "",
  partnerLogosFolder: "",
  videoUrl: "",
  missingMaterials: "",
  usePexels: "",
  uploadedFiles: {},
  domainStatus: "",
  currentDomain: "",
  registrar: "",
  desiredDomain: "",
  integrations: [],
  pixelIds: "",
  crmCurrent: "",
  deadline: "",
  pendingToStart: "",
  bestContactTime: "",
  finalNotes: "",
};

let storageAvailable = true;
let state = loadState();
let currentStep = state.lastStep || 'model';
let submitStatus = null;
let isSubmitting = false;
let showSavePanel = false;
const yesNoHelp = [['','Escolha'],['sim','Sim'],['nao','Não'],['nao-sei','Quero orientação da Jumper']];
const goalChoices = [['','Escolha'],['whatsapp','Receber contatos pelo WhatsApp'],['agendamento','Receber agendamentos'],['leads','Receber pedidos de orçamento'],['venda','Apresentar produtos ou serviços para vender'],['autoridade','Transmitir confiança'],['portfolio','Mostrar meus trabalhos ou produtos'],['nao-sei','Quero ajuda para definir']];
const fieldsByStep = {
  business: [
    ['businessName','Qual é o nome do negócio?','text','Nome que deve aparecer no site',null,true],
    ['shortDescription','O que seu negócio faz?','textarea','Explique com suas palavras. Não precisa escrever um texto pronto para o site.',null,true],
    ['targetAudience','Quem você atende?','text','Ex.: famílias do bairro, empresas, pessoas buscando atendimento',null,true],
    ['cityCoverage','Em quais cidades ou regiões?','text','Pode ser atendimento online ou em todo o Brasil.',null,true],
  ],
  goals: [
    ['mainGoal','O que você mais espera do site?','select','',goalChoices,true],
    ['priorityOffer','O que merece mais destaque?','text','Um serviço, produto, tipo de trabalho ou o próprio negócio.',null,true],
    ['differentiator','Por que seus clientes escolhem você?','textarea','O que muda na prática para quem escolhe seu negócio? Evite responder apenas “qualidade” ou “bom atendimento”.',null,true],
    ['differentiatorEvidence','Conte um exemplo que mostre essa diferença','textarea','Pode ser uma etapa do trabalho, um cuidado específico, um produto próprio ou uma situação real, sem expor dados pessoais. Se ainda não souber, peça ajuda para identificar.',null,true],
  ],
  contact: [
    ['contactName','Com quem vamos falar sobre o projeto?','text','Seu nome',null,true],
    ['whatsapp','WhatsApp para contato','tel','Com DDD. Preencha este campo ou o e-mail.'],
    ['contactEmail','E-mail para contato','email','Preencha este campo ou o WhatsApp.'],
    ['contactUse','Podemos mostrar esse contato no site?','select','',[['','Escolha'],['sim','Sim, pode usar no site'],['outro','Quero usar outro contato público'],['depois','Vamos decidir depois']],true],
  ],
  style: [
    ['personality','Que impressão o site deve passar?','select','',[['','Escolha'],...personalities.map(([v,t,d])=>[v,`${t} — ${d}`]),['nao-sei','Quero uma recomendação da Jumper']],true],
    ['primaryColor','Alguma cor que precisa aparecer?','text','Pode escrever o nome da cor ou dizer que está no material da marca.'],
    ['visualReferences','Quais sites ou marcas são boas referências?','textarea','Cole links e diga o que gosta: fotos, cores, organização ou linguagem. Se não tiver referências, diga isso.',null,true],['avoidSite','Há algum estilo de site que você quer evitar?','textarea','Se possível, explique o motivo.'],['voiceTone','Como sua marca conversa com o público?','select','',[['','Definir com a Jumper'],['formal-cortes','Formal e cortês'],['casual-amistoso','Casual e amistoso'],['direto-premium','Direto e premium'],['objetivo-profissional','Objetivo e profissional']]],
    ['forbiddenWords','Algo que devemos evitar ou respeitar?','textarea','Cores, imagens, palavras, promessas ou cuidados importantes.'],
  ],
  materials: [
    ['materialsStatus','Como prefere enviar logo, fotos e textos?','select','',[['','Escolha'],['link','Tenho uma pasta ou link para compartilhar'],['later','Vou organizar e enviar depois'],['existing','Quero aproveitar materiais do meu site atual']],true],
    ['aiImages','Podemos criar imagens com IA enquanto aguardamos suas fotos?','select','',[['','Escolha'],['sim','Sim, quero avaliar as imagens antes da publicação'],['nao','Não, use apenas materiais autorizados'],['nao-sei','Quero orientação antes de decidir']],true],
    ['usePexels','Se faltar alguma foto, podemos usar um banco de imagens?','select','',[['','Escolha'],['fallback','Sim, somente se faltar material adequado'],['nao','Não'],['nao-sei','Quero orientação antes de decidir']],true],
  ],
  finish: [
    ['deadline','Existe alguma data importante?','text','Se houver, diga a data e o motivo.'],
    ['domainStatus','Você já tem um endereço para o site?','select','',[['','Escolha'],['sim-registrado','Sim, já tenho um domínio'],['quero-registrar','Ainda não tenho'],['nao-sei','Preciso de ajuda para conferir']]],
    ['finalNotes','Faltou contar algo importante?','textarea','Pedidos especiais, cuidados ou informações que ajudam no projeto.'],
  ],
};
const steps = [
  {id:'model',title:'Vamos começar pelo seu site',description:'Escolha o modelo combinado com a Jumper. Responda com suas palavras; o planejamento e os detalhes técnicos ficam com a nossa equipe.',render:()=>choiceCards('model',models.map(([value,title,text])=>({value,title:`${value} · ${title}`,text})))+`<p class="help">Não sabe o modelo? Confira com quem contratou o projeto antes de continuar.</p><section class="draft-import" aria-labelledby="draft-import-title"><div class="draft-import-copy"><strong id="draft-import-title">Já começou este briefing em outro aparelho?</strong><p>Selecione a cópia de rascunho que você baixou para continuar de onde parou.</p></div><label class="draft-upload-control"><input type="file" id="draft-import" accept="application/json,.json"><span>Selecionar cópia do rascunho</span></label><span class="draft-import-status" id="draft-import-status" aria-live="polite">Nenhum arquivo selecionado</span></section>`},
  {id:'business',title:'Conte um pouco sobre o negócio',description:'Quatro respostas curtas já nos ajudam a entender o ponto de partida.',render:()=>fields(fieldsByStep.business)},
  {id:'goals',title:'O que o site precisa trazer para você?',description:'Escolha a prioridade. A Jumper transforma suas respostas em conteúdo e caminhos de contato.',render:()=>fields(fieldsByStep.goals)},
  {id:'audience',title:'O que leva seu cliente a procurar você?',description:'Respostas curtas e exemplos reais ajudam a escrever um site com a voz do seu negócio.',render:()=>fields([
    ['typicalProblem','Que necessidade ou problema você resolve?','textarea','O que costuma acontecer antes de alguém procurar seu negócio?',null,true],
    ['typicalResult','O que seu cliente espera conseguir?','textarea','Descreva o benefício real. Evite promessas que não possa cumprir.',null,true],
    ['customerQuestions','O que seus clientes perguntam antes de contratar ou comprar?','textarea','Liste 2 ou 3 dúvidas e como você costuma responder. Se o negócio é novo, diga quais dúvidas espera receber; vamos validar juntos.',null,true],
    ['notFor','Existe algum público ou pedido que você não atende?','text','Ex.: região fora da cobertura, serviço que não oferece.'],
    ['mustHaveMessage','Qual mensagem não pode faltar no site?','textarea','Uma informação que o visitante precisa entender para escolher você.'],
  ])},
  {id:'offer',title:'Vamos apresentar bem sua oferta',description:'Não precisa redigir textos prontos. Explique a oferta e o caminho de contratação. Loja, pagamento ou reserva automática dependem do escopo combinado.',render:()=>fields([
    ['servicesItems','Quais serviços, produtos ou planos precisam aparecer?','textarea','Para cada um, diga o nome, o que inclui e para quem serve. Se a lista estiver em um material, indique onde.',null,true],
    ['serviceProcess','Como funciona, do primeiro contato até a entrega ou atendimento?','textarea','Descreva as etapas, prazos habituais e o que o cliente precisa saber ou preparar. Para produtos, explique pedido, retirada ou entrega.',null,true],
    ['pricingDisplay','Como o site deve tratar os preços?','select','',[['','Escolha'],['todos','Mostrar os preços'],['sem-precos','Pedir orçamento'],['misto','Mostrar alguns preços'],['nao-sei','Preciso decidir com a Jumper']],true],
    ...(['todos','misto'].includes(state.pricingDisplay)?[['pricingDetails','Quais valores e condições podem ser divulgados?','textarea','Relacione oferta e preço, ou indique a tabela que enviará. Inclua o que o valor cobre e as condições. Nada será publicado sem conferência.',null,true]]:[]),
    ['primaryCTA','Qual deve ser a principal ação do visitante?','select','',[['','Escolha'],['whatsapp','Chamar no WhatsApp'],['agendamento','Agendar atendimento'],['orcamento','Pedir orçamento'],['comprar','Iniciar uma compra ou contratação'],['catalogo','Ver o catálogo'],['servicos','Conhecer os serviços'],['nao-sei','Quero orientação']],true],
    ...(state.model==='M1'&&state.primaryCTA==='agendamento'?[['appointmentLink','Já existe um link para agendar?','url','Cole o link público, se houver. A Jumper confirma o destino antes de publicar.']]:[]),
    ['promotion','Existe condição especial ou informação sobre contratação?','textarea','Prazos, formas de atendimento, condições ou regras que precisam ficar claras.'],
  ])},
  {id:'trust',title:'O que mostra a experiência do seu negócio?',description:'História e provas reais tornam o site específico. Não ter avaliações ainda é uma resposta válida.',render:()=>fields([
    ['story','Como o negócio começou e o que o caracteriza hoje?','textarea','Conte a trajetória, especialidade ou jeito de trabalhar. Para um negócio novo, explique a proposta.',null,true],
    ['hasTestimonials','Há avaliações ou depoimentos reais disponíveis?','select','',yesNoHelp,true],
    ...(state.hasTestimonials==='sim'?[
      ['testimonials','Quais avaliações podemos consultar?','textarea','Cole os textos ou links. Se vai enviar depois, informe onde estão.',null,true],
      ['testimonialsPermission','Como foi autorizado o uso desses depoimentos?','select','',[['','Escolha'],['nome-foto','Nome e foto autorizados'],['primeiro-nome','Somente primeiro nome ou iniciais'],['anonimo','Publicação anônima autorizada'],['nao-sei','Ainda preciso confirmar a autorização']],true],
    ]:[]),
    ['credibilityNumbers','Há números reais que ajudam a apresentar sua experiência?','text','Ex.: anos de atuação, projetos entregues. Só informe dados verificáveis.'],
    ['credentials','Existem certificações, prêmios ou parceiros relevantes?','textarea','Informe os nomes e, se possível, onde podemos conferir.'],
  ])},
  {id:'m5-reformulation',title:'O que vamos melhorar no site atual?',description:'A Jumper vai analisar as páginas e preparar uma proposta de estrutura para sua aprovação.',condition:()=>state.model==='M5',render:()=>fields([
    ['existingSiteUrl','Qual é o endereço do site atual?','url','https://seusite.com.br',null,true],
    ['reformulationReason','O que você gostaria de melhorar?','textarea','Ex.: facilitar contatos, atualizar informações ou mudar o visual.',null,true],
    ['existingSiteProblems','O que hoje atrapalha o visitante ou sua equipe?','textarea','Ex.: informações antigas, dificuldade para contato, navegação ou funcionamento no celular.'],
  ])},
  {id:'m5-scope',title:'O que deve continuar e o que precisa mudar?',description:'Este levantamento orienta a reformulação. A Jumper vai conferir o site e aprovar com você as páginas e os recursos antes de construir.',condition:()=>state.model==='M5',render:()=>fields([
    ['preserveItems','O que precisa ser preservado?','textarea','Marca, fotos, conteúdos ou recursos. Pode responder “nada específico” ou pedir uma análise.',null,true],
    ['changeItems','O que precisa ser atualizado ou reorganizado?','textarea','Cite informações ou partes do site que precisam de revisão.'],
    ['removeItems','O que não deve continuar na nova versão?','textarea','Se não há nada definido, diga “nenhum item definido”. Não vamos interpretar campo vazio como autorização para remover.',null,true],
    ['addItems','O que precisa ser acrescentado?','textarea','Descreva a necessidade, sem se preocupar com a solução técnica.'],
    ['requestedPages','Quais páginas você espera na nova versão?','textarea','Liste as páginas ou escreva “quero que a Jumper proponha a estrutura”.',null,true],
    ['existingFeatures','O que o site faz hoje que precisamos considerar?','textarea','Ex.: contato, agenda, blog, catálogo, pedidos ou área de acesso. Se não souber, peça que a Jumper confira.',null,true],
    ['importantUrls','Há algum link que não pode deixar de funcionar?','textarea','Links usados em anúncios, redes sociais ou materiais. A equipe também fará o levantamento técnico.'],
  ])},
  {id:'operation',title:'Como você atende seus clientes?',description:'Escolha a forma principal de atendimento. Se combina formatos, conte isso nos horários ou nas observações finais.',render:()=>fields([
    ['businessNature','Seu atendimento é…','select','',[['','Escolha'],...businessNatures.map(([v,t])=>[v,t])],true],
    ...(['A','B'].includes(state.businessNature)?[
      ['showAddress','Como podemos mostrar sua localização?','select','',[['','Escolha'],['sim-mapa','Endereço completo e localização'],['bairro-cidade','Somente bairro e cidade'],['nao-publico','Não mostrar endereço']],true],
      ...(state.showAddress==='sim-mapa'?[['address','Endereço completo','text','Rua, número, bairro, cidade e CEP']]:[]),
    ]:[]),
    ...(state.businessNature?[['businessHours','Dias e horários de atendimento','text','Pode deixar para enviar depois.']]:[])
  ])},
  {id:'structure',title:'Quais partes fazem sentido para seu site?',description:'Marque apenas o que precisa. Recursos adicionais serão conferidos com o escopo contratado antes de construir.',condition:()=>state.model!=='M1'&&Boolean(state.model),render:()=>structureMarkup()},
  {id:'contact',title:'Como podemos falar com você?',description:'Informe um WhatsApp ou e-mail. Vamos separar o contato do projeto do contato que será público.',render:()=>'<p class="contact-requirement"><strong>Um canal de contato é obrigatório.</strong> Preencha WhatsApp ou e-mail. Você também pode informar os dois.</p>'+fields([...fieldsByStep.contact,['instagram','Instagram do negócio','text','Informe o perfil, se houver.'],['googleBusiness','Perfil do negócio no Google','url','Link público, se houver.'],...(state.contactUse==='outro'?[['publicContact','Contato que pode aparecer no site','text','WhatsApp, telefone ou e-mail público',null,true]]:[])])},
  {id:'style',title:'Que sensação sua marca deve transmitir?',description:'Não precisa entender de design. Você pode pedir uma recomendação e aprovar a direção visual depois.',render:()=>fields(fieldsByStep.style)},
  {id:'materials',title:'Vamos reunir os materiais',description:'Uma única pasta com logo, fotos e textos é suficiente. Você também pode enviar depois. Não compartilhe senhas.',render:()=>fields([
    fieldsByStep.materials[0],
    ...(state.materialsStatus==='link'?[['materialsFolder','Link da pasta de materiais','url','Drive, Dropbox ou outro link acessível à Jumper',null,true]]:[]),
    ...(state.materialsStatus==='existing'&&state.model!=='M5'?[['existingSiteUrl','Endereço do site com os materiais','url','https://seusite.com.br',null,true]]:[]),
    ...fieldsByStep.materials.slice(1),['missingMaterials','Quais materiais já existem e quais faltam?','textarea','Logo, manual da marca, fotos reais, textos, catálogo ou vídeos. Diga também o que a Jumper precisará ajudar a produzir.'],
  ])+`<p class="help">Os arquivos ficam na pasta compartilhada. Este formulário recebe o link, não faz upload das fotos. Imagens provisórias serão identificadas para sua aprovação.</p>`},
  {id:'finish',title:'Mais algum cuidado antes de começar?',description:'Esta etapa é opcional. O que ainda não souber será conferido pela Jumper.',render:()=>fields([
    fieldsByStep.finish[0],
    ...(state.model!=='M5'?[fieldsByStep.finish[1],...(state.domainStatus==='sim-registrado'?[['currentDomain','Qual é o endereço?','text','seusite.com.br']]:[])]:[]),
    fieldsByStep.finish[2],
  ])},
  {id:'review',title:'Confira antes de enviar',description:'Você pode editar cada parte. Depois do envio, a Jumper confere as informações e combina os próximos passos.',render:()=>resultMarkup()},
];

function structureMarkup() {
  const gallery = state.model==='M3'||state.wantsGallery==='sim';
  const team = state.wantsTeam==='sim';
  const blog = ['M4','M5'].includes(state.model)&&['blog-ativo','novidades'].includes(state.blogMode);
  const base = [
    ...(state.model==='M2'?[['secondaryPage','Qual será a segunda página?','select','',[['','Escolha'],['sobre','Sobre o negócio'],['servicos','Serviços'],['contato','Contato'],['outra','Outra página combinada com a Jumper'],['nao-sei','Quero ajuda para escolher']],true],['secondaryPageGoal','O que essa segunda página precisa mostrar ou resolver?','textarea','Diga o assunto, o conteúdo principal e a ação esperada. Se escolheu outra página, informe qual. Se precisa de orientação, conte a necessidade.',null,true]]:[]),
    ...(state.model!=='M3'?[['wantsGallery','Quer mostrar uma galeria ou catálogo?','select','',yesNoHelp]]:[]),
    ['wantsTeam','Quer apresentar a equipe ou profissionais?','select','',yesNoHelp],
    ...(['M4','M5'].includes(state.model)?[['blogMode','Quer publicar artigos ou novidades?','select','',[['','Decidir depois'],['blog-ativo','Sim, com frequência'],['novidades','Sim, de vez em quando'],['sem-blog','Não preciso agora'],['nao-sei','Quero orientação']]]]:[]),
    ['wantsBooking','Precisa de agendamento ou reserva pelo site?','select','',yesNoHelp],
  ];
  return fields(base)
    +(gallery?detailSection('Detalhes da galeria ou catálogo',[
      ['portfolioType','O que você quer mostrar?','select','',[['','Decidir depois'],['portfolio','Trabalhos ou projetos'],['catalogo','Produtos ou cardápio'],['fotos-videos','Fotos e vídeos'],['antes-depois','Antes e depois']]],
      ['portfolioItemsDescription','Quais itens devem aparecer e o que contar sobre eles?','textarea','Produtos: nome, características, variações e como pedir. Trabalhos: contexto, sua participação e resultado real. Indique onde estão fotos e detalhes; não precisa transcrever o catálogo inteiro.',null,true],['portfolioMinItems','Quantidade aproximada de itens','text','Ex.: 10 produtos. Se não souber, escreva “a confirmar”.',null,true],['portfolioCategories','Como esses itens podem ser agrupados?','textarea','Tipos de serviço, linhas de produtos ou categorias de trabalhos.'],['portfolioPricing','Os itens terão preços?','select','',[['','Definir depois'],['sim-valores','Sim, com valores'],['nao-orcamento','Não, apenas orçamento'],['alguns','Alguns com preço']]]
    ]):'')
    +(team?detailSection('Detalhes da equipe', [['teamList','Quem devemos apresentar?','textarea','Para cada pessoa: nome, função, especialidade e experiência que podemos conferir. Indique também onde estão as fotos autorizadas ou o que enviará depois.',null,true]]):'')
    +(blog?detailSection('Detalhes das publicações', [['blogFrequency','Com que frequência pretende publicar?','select','',[['','Decidir depois'],['1-semana','Semanalmente'],['1-mes','Mensalmente'],['irregular','Quando houver novidades']]],['blogInitialPosts','Que temas ou textos devem iniciar as publicações?','textarea','Liste temas ligados às dúvidas do seu público e indique quem fornecerá ou aprovará os textos. Se precisar de apoio, diga isso; não inventaremos artigos atribuídos à sua equipe.',null,true]]):'')
    +(state.wantsBooking==='sim'?detailSection('Detalhes do agendamento', [['appointmentLink','Já usa uma ferramenta para agendar?','url','Cole o link, se tiver. Se não, vamos orientar.']]):'');
}

function detailSection(title,items) {return `<section class="detail-section"><h3>${escapeHtml(title)}</h3><p class="conditional-help">Você escolheu incluir este recurso. Preencha os campos marcados como obrigatórios; os opcionais podem ficar para depois.</p>${fields(items)}</section>`;}
function optionalDetails(title, items) {
  return `<details class="optional-details"><summary>${escapeHtml(title)} <span>opcional</span></summary>${fields(items)}</details>`;
}
function fields(items) {return `<div class="field-grid">${items.map(fieldMarkup).join('')}</div>`;}
function fieldMarkup([name,label,type,hint,options,required],index) {
  const value=escapeHtml(state[name]||'');
  const contactAlternative=['whatsapp','contactEmail'].includes(name);
  const requirement=contactAlternative?'Preencha pelo menos um':required?'Obrigatório':'Opcional';
  const requirementClass=contactAlternative?'alternative':required?'required':'optional';
  const described=(hint?` aria-describedby="${name}-help"`:'')+(required?' aria-required="true"':'');
  let control;
  if(type==='select') control=`<select id="${name}" name="${name}" ${described}>${options.map(([v,t])=>`<option value="${escapeHtml(v)}" ${state[name]===v?'selected':''}>${escapeHtml(t)}</option>`).join('')}</select>`;
  else if(type==='textarea') control=`<textarea rows="3" maxlength="8000" id="${name}" name="${name}" ${described}>${value}</textarea>`;
  else control=`<input type="${type}" id="${name}" name="${name}" value="${value}" maxlength="2000" ${described} ${name==='contactName'?'autocomplete="name"':name==='contactEmail'?'autocomplete="email"':name==='whatsapp'?'autocomplete="tel"':''}>`;
  return `<div class="field ${type==='textarea'||type==='url'?'full':''}"><div class="field-head"><label for="${name}">${escapeHtml(label)} <span class="requirement-badge requirement-${requirementClass}">${requirement}</span></label></div>${control}${hint?`<p class="field-help" id="${name}-help">${escapeHtml(hint)}</p>`:''}</div>`;
}
function choiceCards(name,options) {return `<fieldset class="choice-fieldset"><legend class="model-legend">Modelo contratado <span class="requirement-badge requirement-required">Obrigatório</span></legend><div class="choice-grid">${options.map(o=>`<label class="choice"><input type="radio" name="${name}" value="${o.value}" ${state[name]===o.value?'checked':''}><strong>${escapeHtml(o.title)}</strong><span class="choice-copy">${escapeHtml(o.text)}</span></label>`).join('')}</div></fieldset>`;}
function escapeHtml(value) {return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function slugify(value) {return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function visibleSteps() {return steps.filter(s=>!s.condition||s.condition());}
function validUrl(value) {try {const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}

// Only fields relevant to the current choices become active construction inputs.
function activeState() {
  const s=structuredClone(state);
  if(s.contactUse!=='outro')s.publicContact='';
  if(s.domainStatus!=='sim-registrado')s.currentDomain='';
  if(s.model!=='M2'){s.secondaryPage='';s.secondaryPageGoal='';}
  if(!['todos','misto'].includes(s.pricingDisplay))s.pricingDetails='';
  if(s.model==='M1'){s.wantsGallery='nao';s.wantsTeam='nao';s.wantsBooking=s.primaryCTA==='agendamento'?'sim':'nao';}
  if(s.model==='M3')s.wantsGallery='sim';
  if(!['M4','M5'].includes(s.model))s.blogMode='sem-blog';
  if(!['blog-ativo','novidades'].includes(s.blogMode)){s.blogFrequency='';s.blogInitialPosts='';}
  if(s.wantsGallery!=='sim')for(const k of ['portfolioType','portfolioCategories','portfolioMinItems','portfolioPricing','portfolioItemsDescription','galleryFolder'])s[k]='';
  s.teamSection=s.wantsTeam==='sim'?'sim-nomes':'';
  if(s.wantsTeam!=='sim'){s.teamList='';s.teamPhotosFolder='';}
  if(s.wantsBooking!=='sim')s.appointmentLink='';
  if(s.hasTestimonials!=='sim'){s.testimonials='';s.testimonialsPermission='';}
  if(!['A','B'].includes(s.businessNature)){s.address='';s.showAddress='';}
  if(s.showAddress!=='sim-mapa'){s.address='';}
  if(s.materialsStatus!=='link')s.materialsFolder='';
  s.uploadedFiles={};s.additionalImages={};
  s.integrations=(s.integrations||[]).filter(k=>!['scheduler','newsletter','live-chat'].includes(k));
  if(s.wantsBooking==='sim')s.integrations.push('scheduler');
  return s;
}
function pendingDecisions(s) {
  const pending=['Conferir dados e autorização dos materiais; preparar conteúdo sem inventar fatos.','Confirmar páginas, funcionalidades e limites contratados antes de construir.','Validar contatos públicos, domínio e integrações; solicitar acessos por canal adequado.'];
  if(s.personality==='nao-sei')pending.push('Propor personalidade visual A–F e obter aprovação.');
  if(s.mainGoal==='nao-sei')pending.push('Definir objetivo comercial e ação principal com o cliente.');
  if(s.primaryCTA==='nao-sei'||s.pricingDisplay==='nao-sei')pending.push('Definir chamada principal e apresentação de preços com o cliente.');
  if(s.hasTestimonials==='sim'&&s.testimonialsPermission==='nao-sei')pending.push('Confirmar autorização dos depoimentos antes de publicar.');
  if(s.secondaryPage==='nao-sei')pending.push('Definir e aprovar a segunda página do M2.');
  if(s.materialsStatus==='later')pending.push('Receber logo, fotos e textos pelo link de materiais.');
  if(s.aiImages==='nao-sei'||s.usePexels==='nao-sei')pending.push('Confirmar permissões de mídia; não interpretar dúvida como autorização.');
  if(s.model==='M5')pending.push('Analisar o site atual e inventariar páginas, conteúdos, funções e URLs; aprovar escopo, backup e recuperação.');
  if(s.wantsGallery==='sim')pending.push('Conferir itens, quantidade e organização da galeria/catálogo.');
  if(s.wantsTeam==='sim')pending.push('Conferir nomes, descrições e fotos autorizadas da equipe.');
  if(['blog-ativo','novidades'].includes(s.blogMode))pending.push('Conferir publicações iniciais e implementar Blog Autônomo Jumper quando aprovado no escopo.');
  if(s.contactUse!=='sim')pending.push('Não publicar o contato privado do projeto sem confirmação.');
  return pending;
}
function stepError(id) {
  const required={business:['businessName','shortDescription','targetAudience','cityCoverage'],goals:['mainGoal','priorityOffer','differentiator','differentiatorEvidence'],audience:['typicalProblem','typicalResult','customerQuestions'],offer:['servicesItems','serviceProcess','pricingDisplay','primaryCTA'],trust:['story','hasTestimonials'],'m5-scope':['preserveItems','removeItems','requestedPages','existingFeatures'],contact:['contactName','contactUse'],operation:['businessNature'],style:['personality','visualReferences'],materials:['materialsStatus','aiImages','usePexels']};
  const missing=(required[id]||[]).find(k=>!String(state[k]||'').trim());
  if(missing)return {field:missing,message:'Responda este campo para continuar. Quando disponível, você pode escolher a ajuda da Jumper.'};
  if(id==='model'&&!models.some(m=>m[0]===state.model))return {field:'model',message:'Escolha o modelo combinado com a Jumper.'};
  if(id==='m5-reformulation'){
    if(!validUrl(state.existingSiteUrl))return {field:'existingSiteUrl',message:'Informe o endereço completo do site, começando por https:// ou http://.'};
    if(!state.reformulationReason.trim())return {field:'reformulationReason',message:'Conte com suas palavras o que gostaria de melhorar.'};
  }
  if(id==='operation'&&['A','B'].includes(state.businessNature)&&!state.showAddress)return {field:'showAddress',message:'Escolha como podemos mostrar sua localização.'};
  if(id==='structure'&&state.model==='M2'&&!state.secondaryPageGoal.trim())return {field:'secondaryPageGoal',message:'Conte a finalidade e o conteúdo desejado para a segunda página.'};
  if(id==='offer'&&['todos','misto'].includes(state.pricingDisplay)&&!state.pricingDetails.trim())return {field:'pricingDetails',message:'Informe os preços ou indique a tabela que será enviada para conferência.'};
  if(id==='structure'&&state.model==='M2'&&!state.secondaryPage)return {field:'secondaryPage',message:'Escolha a segunda página ou peça orientação da Jumper.'};
  if(id==='contact'){
    if(state.googleBusiness&&!validUrl(state.googleBusiness))return {field:'googleBusiness',message:'Confira o link completo do perfil no Google ou deixe para enviar depois.'};
    if(!state.whatsapp.trim()&&!state.contactEmail.trim())return {field:'whatsapp',message:'Informe pelo menos um WhatsApp ou e-mail para falarmos com você.'};
    if(state.whatsapp&&state.whatsapp.replace(/\D/g,'').length<10)return {field:'whatsapp',message:'Confira o WhatsApp e inclua o DDD.'};
    if(state.contactEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contactEmail))return {field:'contactEmail',message:'Confira o e-mail informado.'};
    if(state.contactUse==='outro'&&!state.publicContact.trim())return {field:'publicContact',message:'Informe o contato que pode aparecer no site.'};
  }
  if(id==='materials'){
    if(state.materialsStatus==='link'&&!validUrl(state.materialsFolder))return {field:'materialsFolder',message:'Cole o link completo da pasta, começando por https://.'};
    if(state.materialsStatus==='existing'&&state.model!=='M5'&&!validUrl(state.existingSiteUrl))return {field:'existingSiteUrl',message:'Informe o endereço do site de onde podemos aproveitar os materiais.'};
  }
  if(id==='trust'&&state.hasTestimonials==='sim')for(const k of ['testimonials','testimonialsPermission'])if(!state[k].trim())return {field:k,message:'Informe a origem das avaliações e a situação da autorização.'};
  if(id==='structure'){
    const keys=[];
    if(state.model==='M3'||state.wantsGallery==='sim')keys.push('portfolioItemsDescription','portfolioMinItems');
    if(state.wantsTeam==='sim')keys.push('teamList');
    if(['M4','M5'].includes(state.model)&&['blog-ativo','novidades'].includes(state.blogMode))keys.push('blogInitialPosts');
    for(const k of keys)if(!state[k].trim())return {field:k,message:'Conte o que já sabe. Se faltam dados, indique o que será enviado ou precisa de orientação.'};
  }
  if(id==='review'&&!state.reviewConfirmed)return {field:'reviewConfirmed',message:'Confirme o modelo e as respostas para enviar.'};
  if(((id==='structure'&&state.wantsBooking==='sim')||(id==='offer'&&state.model==='M1'&&state.primaryCTA==='agendamento'))&&state.appointmentLink&&!validUrl(state.appointmentLink))return {field:'appointmentLink',message:'Confira o link completo de agendamento ou deixe para enviar depois.'};
  return null;
}
function buildPayload() {
  const state = activeState();
  const slug = slugify(state.businessName || "cliente-sem-nome");
  const hasBlog = ["M4", "M5"].includes(state.model) && ["blog-ativo", "novidades"].includes(state.blogMode);

  const payload = {
    briefing_depth: "strategic-v3",
    intake_version: "guided-v1",
    submission_id: state.submissionId,
    id: FORM_ID,
    source: "jumper.studio",
    channel: "site-publico",
    created_at: new Date().toISOString(),
    client: {
      name: state.businessName,
      slug,
      segment: state.segment,
      contact: {
        responsible: state.contactName,
        whatsapp: state.whatsapp,
        email: state.contactEmail,
        phone: state.phone,
      },
      social: {
        instagram: state.instagram,
        facebook: state.facebook,
        linkedin: state.linkedin,
      },
      founded_year: state.foundedYear,
      document: state.cnpj,
    },
    project_scope: {
      model: state.model,
      reformulation: state.model === "M5" ? {
        existing_site_url: state.existingSiteUrl,
        reason: state.reformulationReason,
        problems: state.existingSiteProblems,
        preserve: state.preserveItems,
        change: state.changeItems,
        remove: state.removeItems,
        add: state.addItems,
        requested_pages: state.requestedPages,
        existing_features: state.existingFeatures,
        important_urls: state.importantUrls,
        access_notes: state.accessNotes,
        scope_status: "pending_review",
      } : null,
      model_confirmation: state.reviewConfirmed,
      business_nature: state.businessNature,
      secondary_page: state.model === "M2" ? state.secondaryPage : null,
      secondary_page_goal: state.model === "M2" ? state.secondaryPageGoal : "",
      has_blog: hasBlog,
      use_pexels_as_placeholder: state.usePexels === "sim",
      pexels_mode: state.usePexels,
    },
    location: {
      city_coverage: state.cityCoverage,
      address: state.address,
      show_address: state.showAddress,
      google_business: state.googleBusiness,
      business_hours: state.businessHours,
      service_area: state.serviceArea,
    },
    content: {
      positioning: {
        short_description: state.shortDescription,
        differentiator: state.differentiator,
        differentiator_evidence: state.differentiatorEvidence,
        must_have_message: state.mustHaveMessage,
        client_voice_quote: state.clientVoiceQuote,
        story: state.story,
      },
      audience: {
        target: state.targetAudience,
        not_for: state.notFor,
        typical_problem: state.typicalProblem,
        questions_raw: state.customerQuestions,
        typical_result: state.typicalResult,
      },
      conversion: {
        main_goal: state.mainGoal,
        primary_cta: state.primaryCTA,
        priority_offer: state.priorityOffer,
        appointment_link: state.appointmentLink,
      },
      services: {
        items_raw: state.servicesItems,
        process_raw: state.serviceProcess,
        pricing_details: state.pricingDetails,
        pricing_mode: state.pricingDisplay,
        promotion: state.promotion,
      },
      portfolio: {
        mode: state.portfolioType,
        categories_raw: state.portfolioCategories,
        minimum_items: state.portfolioMinItems,
        pricing_mode: state.portfolioPricing,
        items_description: state.portfolioItemsDescription,
      },
      team: {
        enabled: state.teamSection,
        members_raw: state.teamList,
      },
      social_proof: {
        testimonials_available: state.hasTestimonials,
        testimonials_raw: state.testimonials,
        testimonials_permission: state.testimonialsPermission,
        stats_raw: state.credibilityNumbers,
        google_rating: state.googleRating,
        credentials_raw: state.credentials,
      },
      blog: {
        enabled: hasBlog,
        mode: state.blogMode,
        frequency: state.blogFrequency,
        initial_posts_raw: state.blogInitialPosts,
        admin_login_path: hasBlog ? "/admin/" : null,
        posts_storage: hasBlog ? "data/blog-posts.json" : null,
        uploads_path: hasBlog ? "public/uploads/blog/" : null,
      },
    },
    creative_direction: {
      personality: state.personality,
      voice_tone: state.voiceTone,
      visual_references: state.visualReferences,
      avoid_site: state.avoidSite,
      primary_color: state.primaryColor,
      secondary_or_forbidden_colors: state.secondaryColors,
      forbidden_words_or_themes: state.forbiddenWords,
      visual_preference: state.visualPreference,
      animation_preference: state.animationPreference,
    },
    assets: {
      materials_folder: state.materialsFolder,
      brand_manual_link: state.brandManualLink,
      logo_link: state.logoLink,
      hero_image_link: state.heroImageLink,
      owner_photos_folder: state.ownerPhotosFolder,
      location_photos_folder: state.locationPhotosFolder,
      team_photos_folder: state.teamPhotosFolder,
      services_photos_folder: state.servicesPhotosFolder,
      gallery_folder: state.galleryFolder,
      partner_logos_folder: state.partnerLogosFolder,
      video_url: state.videoUrl,
      missing_notes: state.missingMaterials,
      availability: state.materialsStatus,
      existing_site_url: state.materialsStatus === "existing" ? state.existingSiteUrl : "",
      ai_placeholder_permission: state.aiImages,
      uploaded_files: state.uploadedFiles,
      additional_images: state.uploadedFiles?.additionalImages || [],
    },
    domain: {
      status: state.domainStatus,
      current: state.currentDomain,
      registrar: state.registrar,
      desired: state.desiredDomain,
    },
    integrations: {
      selected: state.integrations,
      pixel_ids_raw: state.pixelIds,
      crm_current: state.crmCurrent,
    },
    operations: {
      deadline: state.deadline,
      pending_to_start: state.pendingToStart,
      best_contact_time: state.bestContactTime,
      contact_publication: state.contactUse,
      public_contact: state.publicContact,
      final_notes: state.finalNotes,
    },
    site_factory_target: {
      client_folder: `_jumper-sites-system/clientes/${slug}/`,
      raw_entry_folder: `_jumper-sites-system/clientes/${slug}/briefing/entrada/`,
      expected_normalized_briefing: `_jumper-sites-system/clientes/${slug}/briefing/briefing-normalizado.md`,
    },
  };
  payload.production_handoff = {
    status: "needs_review",
    pending_decisions: pendingDecisions(state),
    requested_modules: { gallery: state.wantsGallery, team: state.wantsTeam, booking: state.wantsBooking, blog: state.blogMode },
    note: "Respostas essenciais para análise. A Jumper complementa conteúdo, materiais, arquitetura e validações técnicas antes de construir. Não inventar respostas ausentes.",
  };
  return payload;
}
function answerLabel(options,value,fallback='Decidir com a Jumper') {return options.find(o=>o[0]===value)?.[1]||fallback;}
function reviewGroups() {
  const s=activeState();
  return [
    ['business','Seu negócio',`${s.businessName}\n${s.shortDescription}\nPúblico: ${s.targetAudience}\nAtuação: ${s.cityCoverage}`],
    ['goals','Objetivo',`${answerLabel(goalChoices,s.mainGoal)}\nDestaque: ${s.priorityOffer}\nDiferencial: ${s.differentiator}\nExemplo concreto: ${s.differentiatorEvidence}`],
    ...(s.model==='M5'?[['m5-reformulation','Site atual',`${s.existingSiteUrl}\nMelhorar: ${s.reformulationReason}\nProblemas atuais: ${s.existingSiteProblems||'A analisar'}`]]:[]),
    ['audience','Público e necessidades',`Necessidade: ${s.typicalProblem}\nBenefício esperado: ${s.typicalResult}\nDúvidas e respostas: ${s.customerQuestions}\nNão atende: ${s.notFor||'Não informado'}\nMensagem: ${s.mustHaveMessage||'Não informada'}`],
    ['offer','Oferta e conversão',`Ofertas: ${s.servicesItems}\nComo funciona: ${s.serviceProcess}\nValores e condições: ${s.pricingDetails||"A confirmar, se forem publicados"}\nPreços: ${answerLabel([['todos','Mostrar preços'],['sem-precos','Pedir orçamento'],['misto','Mostrar alguns preços']],s.pricingDisplay)}\nAção principal: ${answerLabel([['whatsapp','Chamar no WhatsApp'],['agendamento','Agendar atendimento'],['orcamento','Pedir orçamento'],['comprar','Iniciar uma compra ou contratação'],['catalogo','Ver catálogo'],['servicos','Conhecer serviços']],s.primaryCTA)}\nLink para agendar: ${s.appointmentLink||"A definir, se necessário"}\nCondições: ${s.promotion||'Não informadas'}`],
    ['trust','História e provas',`História: ${s.story}\nAvaliações: ${answerLabel(yesNoHelp,s.hasTestimonials)}\nDepoimentos: ${s.testimonials||'Não informados'}\nPermissão: ${answerLabel([['nome-foto','Nome e foto autorizados'],['primeiro-nome','Primeiro nome ou iniciais'],['anonimo','Publicação anônima autorizada']],s.testimonialsPermission,'A confirmar')}\nNúmeros: ${s.credibilityNumbers||'Não informados'}\nCredenciais: ${s.credentials||'Não informadas'}`],
    ...(s.model==='M5'?[['m5-scope','Escopo da reformulação',`Preservar: ${s.preserveItems}\nAtualizar: ${s.changeItems||'A conferir'}\nRetirar: ${s.removeItems}\nAcrescentar: ${s.addItems||'A conferir'}\nPáginas: ${s.requestedPages}\nRecursos atuais: ${s.existingFeatures}\nLinks importantes: ${s.importantUrls||'A levantar'}`]]:[]),
    ['operation','Atendimento',`${businessNatures.find(o=>o[0]===s.businessNature)?.[1]||''}\nLocalização: ${s.showAddress==='sim-mapa'?(s.address||'Endereço a confirmar'):s.showAddress==='nao-publico'?'Não mostrar endereço':s.cityCoverage}\nHorários: ${s.businessHours||'A confirmar'}`],
    ...(s.model!=='M1'?[['structure','Partes do site',`${s.model==='M2'?`Segunda página: ${answerLabel([['sobre','Sobre o negócio'],['servicos','Serviços'],['contato','Contato'],['outra','Outra página combinada com a Jumper'],['nao-sei','Quero ajuda para escolher']],s.secondaryPage)}\nFinalidade e conteúdo: ${s.secondaryPageGoal}\n`:''}Galeria: ${answerLabel(yesNoHelp,s.wantsGallery)}${s.wantsGallery==='sim'?`\nItens: ${s.portfolioItemsDescription||'Envio posterior'}\nQuantidade: ${s.portfolioMinItems}\nCategorias: ${s.portfolioCategories||'A organizar'}\nPreços da galeria: ${answerLabel([['sim-valores','Com valores'],['nao-orcamento','Solicitar orçamento'],['alguns','Alguns com preço']],s.portfolioPricing)}`:''}\nEquipe: ${answerLabel(yesNoHelp,s.wantsTeam)}${s.wantsTeam==='sim'?`\nPessoas: ${s.teamList||'Envio posterior'}`:''}\nPublicações: ${answerLabel([['blog-ativo','Publicar com frequência'],['novidades','Publicar de vez em quando'],['sem-blog','Sem publicações por enquanto'],['nao-sei','Quero orientação']],s.blogMode)}${s.blogFrequency?`\nFrequência: ${answerLabel([['1-semana','Semanalmente'],['1-mes','Mensalmente'],['irregular','Quando houver novidades']],s.blogFrequency)}`:''}${s.blogInitialPosts?`\nTemas ou textos: ${s.blogInitialPosts}`:''}\nAgendamento: ${answerLabel(yesNoHelp,s.wantsBooking)}${s.appointmentLink?`\nAgenda: ${s.appointmentLink}`:''}`]]:[]),
    ['contact','Contato',`${s.contactName}\n${s.whatsapp}\n${s.contactEmail}\nInstagram: ${s.instagram||'Não informado'}\nPerfil Google: ${s.googleBusiness||'Não informado'}\nUso no site: ${s.contactUse==='sim'?'Autorizado':s.contactUse==='outro'?s.publicContact:'Decidir depois; contato do projeto é privado'}`],
    ['style','Estilo',`${personalities.find(p=>p[0]===s.personality)?.[1]||'Quero recomendação da Jumper'}\nCor: ${s.primaryColor||'A definir'}\nReferências: ${s.visualReferences||'Não informadas'}\nEvitar: ${s.avoidSite||'Não informado'}\nTom de voz: ${answerLabel([['formal-cortes','Formal e cortês'],['casual-amistoso','Casual e amistoso'],['direto-premium','Direto e premium'],['objetivo-profissional','Objetivo e profissional']],s.voiceTone)}\nCuidados: ${s.forbiddenWords||'Não informados'}`],
    ['materials','Materiais e imagens',`${s.materialsStatus==='link'?s.materialsFolder:s.materialsStatus==='existing'?`Aproveitar materiais de ${s.existingSiteUrl}`:'Vou enviar depois'}\nDisponíveis e pendentes: ${s.missingMaterials||'A conferir'}\nImagens de IA: ${s.aiImages==='sim'?'Pode criar para minha aprovação':s.aiImages==='nao'?'Não autorizado':'Quero orientação'}\nFotos de banco: ${s.usePexels==='fallback'?'Somente se necessário':s.usePexels==='nao'?'Não autorizado':'Quero orientação'}`],
    ['finish','Cuidados finais',`Data importante: ${s.deadline||'Não informada'}\nDomínio: ${s.model==='M5'?s.existingSiteUrl:s.currentDomain||answerLabel([['sim-registrado','Já tenho domínio'],['quero-registrar','Ainda não tenho'],['nao-sei','Preciso de ajuda']],s.domainStatus)}\nObservações: ${s.finalNotes||'Nenhuma'}`],
  ];
}
function resultMarkup() {
  return `<div class="result-box"><p class="scope-note"><strong>${escapeHtml(models.find(m=>m[0]===state.model)?.slice(0,2).join(' · ')||'')}</strong><br>As respostas serão conferidas pela Jumper. Páginas, recursos e materiais pendentes serão combinados antes da construção.</p><div class="review-list">${reviewGroups().map(([id,title,text])=>`<div><span>${escapeHtml(title)}</span><p>${escapeHtml(text)}</p><button type="button" class="edit-button" data-edit="${id}" aria-label="Editar ${escapeHtml(title)}">Editar</button></div>`).join('')}</div><label class="confirmation"><input type="checkbox" id="reviewConfirmed" name="reviewConfirmed" ${state.reviewConfirmed?'checked':''}><span><span class="requirement-badge requirement-required">Obrigatório</span> Confirmo que o modelo ${escapeHtml(state.model)} é o combinado e que estas respostas podem ser usadas pela Jumper na preparação do site.</span></label><p class="help">Não envie senhas. Materiais e informações ainda pendentes serão solicitados pela equipe.</p></div>`;
}
function sanitizeDraft(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Arquivo de rascunho inválido.');
  const s=structuredClone(initialState);
  for(const [key,base]of Object.entries(initialState)){
    const v=raw[key];
    if(typeof base==='string'&&typeof v==='string')s[key]=v.slice(0,10000);
    else if(typeof base==='boolean'&&typeof v==='boolean')s[key]=v;
    else if(Array.isArray(base)&&Array.isArray(v))s[key]=v.filter(x=>typeof x==='string').slice(0,50);
  }
  // A file restore is a draft, never an instruction to submit or a successful receipt.
  s.reviewConfirmed=false;s.submitted=false;s.blogAdminPassword='';
  return s;
}
function loadState() {
  try {
    const saved=localStorage.getItem(STORAGE_KEY);
    if(saved){const raw=JSON.parse(saved);const s=sanitizeDraft(raw);s.submitted=raw.submitted===true;s.reviewConfirmed=raw.reviewConfirmed===true;return s;}
    const old=localStorage.getItem(LEGACY_STORAGE_KEY);
    if(old){const s=sanitizeDraft(JSON.parse(old));s.legacyDraft=true;
      s.wantsGallery=s.model==='M3'||s.portfolioType?'sim':'';
      s.wantsTeam=['sim-fotos-bio','sim-nomes'].includes(s.teamSection)?'sim':'';
      s.wantsBooking=s.appointmentLink?'sim':'';
      s.hasTestimonials=s.testimonials?'sim':'';
      s.materialsStatus=s.materialsFolder?'link':'';
      s.usePexels='';s.aiImages='';s.lastStep='model';return s;
    }
  }catch {storageAvailable=false;}
  return structuredClone(initialState);
}
function saveState() {
  state.lastStep=currentStep;
  try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;}
}
function updateStateFromForm() {
  const data=new FormData(form);
  let answersChanged=false;
  for(const control of Array.from(form.elements)){
    const key=control.name;
    if(!Object.hasOwn(initialState,key))continue;
    const previous=JSON.stringify(state[key]);
    if(control.type==='checkbox'&&typeof initialState[key]==='boolean')state[key]=control.checked;
    else if(Array.isArray(initialState[key]))state[key]=data.getAll(key).map(String);
    else if(data.has(key)&&typeof initialState[key]==='string')state[key]=String(data.get(key));
    if(key!=='reviewConfirmed'&&previous!==JSON.stringify(state[key]))answersChanged=true;
  }
  if(answersChanged)state.reviewConfirmed=false;
  saveState();
}
function resetQuiz() {
  if(!confirm('Apagar este rascunho e começar outro?'))return;
  state=structuredClone(initialState);currentStep='model';submitStatus=null;showSavePanel=false;
  try{localStorage.removeItem(LEGACY_STORAGE_KEY);localStorage.removeItem(STORAGE_KEY);}catch{}
  saveState();render(true);
}
const stepContainer = document.querySelector('#step-container');
const form = document.querySelector('#quiz-form');
const nextButton = document.querySelector('#next-button');
const prevButton = document.querySelector('#prev-button');
const saveButton = document.querySelector('#save-button');

function render(focus=false) {
  const visible=visibleSteps();
  if(!visible.some(s=>s.id===currentStep))currentStep='model';
  const step=visible.find(s=>s.id===currentStep);
  const index=visible.indexOf(step);
  if(state.submitted){
    stepContainer.innerHTML='<div class="step-layout"><header class="step-header"><span>Recebido</span><h2 tabindex="-1">Obrigado por contar sua história.</h2><p>Seu briefing foi recebido pela Jumper. Nossa equipe vai conferir as respostas, os materiais e o escopo antes de dar continuidade ao site.</p></header><button type="button" class="ghost-button" id="new-briefing">Começar outro briefing</button></div>';
    nextButton.hidden=true;prevButton.hidden=true;saveButton.hidden=true;
  }else{
    stepContainer.innerHTML=`<div class="step-layout"><header class="step-header"><span>Etapa ${index+1} de ${visible.length}</span><h2 tabindex="-1">${step.title}</h2><p>${step.description}</p></header>${showSavePanel?`<section class="save-panel" role="status"><strong>${storageAvailable?'Rascunho salvo neste navegador.':'O navegador não conseguiu guardar o rascunho.'}</strong><p>Para continuar em outro aparelho, baixe uma cópia e use “Continuar um rascunho” na primeira etapa. O arquivo contém suas respostas; guarde com cuidado.</p><button type="button" class="ghost-button" id="download-draft">Baixar cópia do rascunho</button><button type="button" class="edit-button" id="close-save">Continuar preenchendo</button></section>`:''}${submitStatus?`<div class="submit-status ${submitStatus.type}" role="${submitStatus.type==='error'?'alert':'status'}" tabindex="-1">${escapeHtml(submitStatus.message)}</div>`:''}${state.legacyDraft&&currentStep==='model'?'<p class="help">Encontramos respostas da versão anterior e as preservamos. Confira o novo caminho e suas preferências de imagens antes de enviar.</p>':''}<div class="step-body">${step.render()}</div></div>`;
    nextButton.hidden=false;saveButton.hidden=false;prevButton.hidden=index===0;
    nextButton.disabled=isSubmitting;prevButton.disabled=isSubmitting;saveButton.disabled=isSubmitting;
    nextButton.textContent=isSubmitting?'Enviando…':currentStep==='review'?'Enviar briefing':currentStep==='finish'?'Revisar respostas':'Continuar';
    if(isSubmitting)for(const e of form.querySelectorAll('input,select,textarea,button'))e.disabled=true;
  }
  renderSummary();saveState();
  if(focus){stepContainer.scrollTop=0;stepContainer.querySelector(submitStatus?.type==='error'?'.submit-status':'h2')?.focus();}
}
const progressLabels={
  model:'Modelo',business:'Seu negócio',goals:'Objetivo',audience:'Público',offer:'Oferta',trust:'Confiança',
  'm5-reformulation':'Site atual','m5-scope':'Escopo da reforma',operation:'Atendimento',structure:'Estrutura',
  contact:'Contato',style:'Estilo',materials:'Materiais',finish:'Cuidados finais',review:'Revisão',
};
function renderSummary() {
  const visible=visibleSteps(),index=visible.findIndex(s=>s.id===currentStep);
  document.querySelector('#summary-score').textContent=state.submitted?'Enviado':`${index+1}/${visible.length}`;
  document.querySelector('#step-count').textContent=state.submitted?'Respostas recebidas':`Etapa ${index+1} de ${visible.length}`;
  document.querySelector('#progress-bar').style.width=`${state.submitted?100:Math.round(index/Math.max(1,visible.length-1)*100)}%`;
  document.querySelector('#draft-status').textContent=state.submitted?'Envio confirmado.':storageAvailable?'Suas respostas ficam salvas neste navegador.':'Para não perder as respostas, use “Salvar para depois” e baixe uma cópia.';
  document.querySelector('#progress-steps').innerHTML=visible.map((step,stepIndex)=>`<li class="${stepIndex===index?'is-current':''}"><span>${stepIndex+1}</span><span>${escapeHtml(progressLabels[step.id]||step.title)}</span></li>`).join('');
}
function goTo(id) {currentStep=id;submitStatus=null;showSavePanel=false;render(true);}
async function next() {
  if(isSubmitting||state.submitted)return;
  updateStateFromForm();const error=stepError(currentStep);
  if(error){showError(error);return;}
  if(currentStep==='review'){await submitBriefing();return;}
  const visible=visibleSteps();goTo(visible[visible.findIndex(s=>s.id===currentStep)+1].id);
}
function showError(error) {
  submitStatus={type:'error',message:error.message};render(true);
  const control=form.elements.namedItem(error.field);
  if(control instanceof HTMLElement){control.setAttribute('aria-invalid','true');control.closest('details')?.setAttribute('open','');control.focus();}
}
async function submitBriefing() {
  if(isSubmitting||state.submitted)return;
  for(const step of visibleSteps()){const error=stepError(step.id);if(error){currentStep=step.id;showError(error);return;}}
  if(!state.submissionId)state.submissionId=crypto.randomUUID();
  saveState();isSubmitting=true;submitStatus={type:'pending',message:'Enviando suas respostas. Aguarde a confirmação.'};render();
  try {
    const response=await fetch(document.querySelector('meta[name="briefing-api"]')?.content || '/api/briefings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(buildPayload())});
    const data=await response.json();
    if(!response.ok)throw Error(data.message||'Não foi possível enviar agora.');
    if(!data.ok||!data.notion_page_id)throw Error('Não recebemos a confirmação. Confira com a Jumper antes de reenviar.');
    state.submitted=true;submitStatus=null;
  }catch(error){submitStatus={type:'error',message:`${error.message} Suas respostas foram mantidas. Se a conexão caiu durante o envio, confira com a Jumper antes de tentar novamente.`};}
  finally{isSubmitting=false;saveState();render(true);}
}
function downloadDraft() {
  const copy=structuredClone(state);copy.submitted=false;copy.reviewConfirmed=false;copy.blogAdminPassword='';
  const blob=new Blob([JSON.stringify({format:'jumper-briefing-draft',version:1,state:copy},null,2)],{type:'application/json'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='meu-briefing-jumper.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}
form.addEventListener('input',()=>{if(!isSubmitting&&!state.submitted){updateStateFromForm();renderSummary();}});
form.addEventListener('change',async event=>{
  if(event.target.id==='draft-import'){
    try{const file=event.target.files[0];const status=document.querySelector('#draft-import-status');if(!file)return;if(status)status.textContent=file.name;if(file.size>500000)throw Error('Arquivo muito grande. Use a cópia de rascunho baixada neste formulário.');const draft=JSON.parse(await file.text());if(draft.format!=='jumper-briefing-draft'||draft.version!==1)throw Error('Use um arquivo de rascunho exportado pelo formulário Jumper.');state=sanitizeDraft(draft.state);currentStep=state.lastStep||'model';submitStatus={type:'success',message:'Rascunho recuperado. Confira as respostas antes de enviar.'};saveState();render(true);}catch(error){submitStatus={type:'error',message:error.message};render(true);}return;
  }
  if(isSubmitting||state.submitted)return;
  const key=event.target.name;
  const openDetails=Array.from(stepContainer.querySelectorAll('details[open]')).map(d=>d.querySelector('summary')?.textContent);
  const scroll=stepContainer.scrollTop;
  updateStateFromForm();
  if(['model','businessNature','showAddress','contactUse','materialsStatus','wantsGallery','wantsTeam','wantsBooking','blogMode','hasTestimonials','domainStatus','pricingDisplay','primaryCTA'].includes(key)){
    if(key==='model')state.reviewConfirmed=false;
    render();for(const d of stepContainer.querySelectorAll('details'))if(openDetails.includes(d.querySelector('summary')?.textContent))d.open=true;
    const control=form.elements.namedItem(key);if(control instanceof HTMLElement)control.focus({preventScroll:true});stepContainer.scrollTop=scroll;
  }else renderSummary();
});
form.addEventListener('submit',event=>{event.preventDefault();next();});
form.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||isSubmitting)return;
  if(button.dataset.edit){updateStateFromForm();state.reviewConfirmed=false;goTo(button.dataset.edit);}
  if(button.id==='download-draft')downloadDraft();
  if(button.id==='close-save'){showSavePanel=false;render(true);}
  if(button.id==='new-briefing')resetQuiz();
});
nextButton.addEventListener('click',next);
prevButton.addEventListener('click',()=>{if(isSubmitting)return;updateStateFromForm();const visible=visibleSteps();const index=visible.findIndex(s=>s.id===currentStep);if(index>0)goTo(visible[index-1].id);});
saveButton.addEventListener('click',()=>{updateStateFromForm();showSavePanel=true;submitStatus=null;render(true);stepContainer.querySelector('.save-panel')?.scrollIntoView({block:'start'});});
window.addEventListener('beforeunload',()=>saveState());
render();
