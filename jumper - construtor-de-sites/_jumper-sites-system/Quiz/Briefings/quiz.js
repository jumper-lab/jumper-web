const STORAGE_KEY = "jumper-studio-briefing-quiz-v2";
const FORM_ID = "jumper-studio-site-factory-briefing";

const models = [
  ["M1", "One Page", "Site de uma página com apresentação, serviços, prova e contato."],
  ["M2", "Duas páginas", "Home completa com uma segunda página escolhida pelo cliente."],
  ["M3", "Portfólio ou catálogo", "Home, galeria/catálogo/portfólio e contato."],
  ["M4", "Completo local", "Home, sobre, serviços, depoimentos, blog/novidades e contato."],
];

const businessNatures = [
  ["A", "Espaço físico aberto ao público"],
  ["B", "Endereço comercial com atendimento por agendamento"],
  ["C", "Profissional autônomo, online ou vai até o cliente"],
  ["D", "Remoto, delivery, móvel ou sem endereço fixo"],
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
  usePexels: "sim",
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

let state = loadState();
let currentStep = 0;
let submitStatus = null;

const steps = [
  {
    id: "model",
    title: "Modelo do site",
    kicker: "Escopo",
    description: "Escolha o modelo contratado. Essa resposta define as próximas perguntas e a arquitetura do site.",
    render: () => choiceCards("model", models.map(([value, title, text]) => ({ value, title: `${modelDisplay(value)} - ${title}`, text }))),
  },
  {
    id: "model-confirmation",
    title: "Confirmação",
    kicker: "Modelo",
    description: "Confirme que este briefing corresponde ao modelo escolhido.",
    condition: () => Boolean(state.model),
    render: () => `
      <div class="field-grid">
        <div class="field full">
          <div class="field-head">
            <span>01</span>
            <label>${modelConfirmationLabel(state.model)}</label>
          </div>
          <div class="option-strip single-option">
            ${checkboxPills("modelConfirmation", [[state.model, "Confirmo"]])}
          </div>
        </div>
      </div>
    `,
  },
  {
    id: "nature",
    title: "Tipo de atendimento",
    kicker: "Operação",
    description: "Informe como o negócio atende. Isso define endereço, mapa, fotos do espaço e área de cobertura.",
    render: () => choiceCards("businessNature", businessNatures.map(([value, title]) => ({ value, title: `${value} - ${title}`, text: natureHelp(value) }))),
  },
  {
    id: "identity",
    title: "Identidade",
    kicker: "Dados básicos",
    description: "Essas informações identificam o cliente e criam a base da pasta no Site Factory.",
    render: () => fields([
      ["businessName", "Nome do negócio", "input", "Ex: Jardim Aurora"],
      ["segment", "Segmento principal", "input", "Ex: clínica, restaurante, escola infantil"],
      ["cityCoverage", "Cidade, bairros ou região de atuação", "input", "Ex: Curitiba, Juvevê, Cabral e região norte"],
      ["contactName", "Responsável principal", "input", "Nome da pessoa responsável pelo briefing"],
    ]),
  },
  {
    id: "contact",
    title: "Contatos",
    kicker: "Canais",
    description: "O site precisa saber quais canais podem aparecer e qual contato receberá as conversões.",
    render: () => fields([
      ["whatsapp", "WhatsApp principal", "input", "+55 11 99999-9999"],
      ["contactEmail", "E-mail principal", "input", "contato@empresa.com"],
      ["instagram", "Instagram", "input", "@empresa ou link"],
      ["phone", "Telefone fixo", "input", "Opcional"],
    ]),
  },
  {
    id: "social-business",
    title: "Dados extras",
    kicker: "Presença",
    description: "Redes, histórico e dados opcionais que ajudam a completar a ficha pública do negócio.",
    render: () => fields([
      ["facebook", "Facebook", "input", "Link opcional"],
      ["linkedin", "LinkedIn", "input", "Link opcional"],
      ["foundedYear", "Ano de fundação", "input", "Ex: 2019"],
      ["cnpj", "CNPJ", "input", "Opcional"],
    ]),
  },
  {
    id: "location",
    title: "Endereço",
    kicker: "Presença local",
    description: "Essas perguntas aparecem para negócios com endereço físico ou atendimento por agendamento.",
    condition: () => ["A", "B"].includes(state.businessNature),
    render: () => fields([
      ["address", "Endereço completo com CEP", "textarea", "Rua, número, bairro, cidade, estado e CEP"],
      ["showAddress", "Exibição do endereço", "select", "", [["", "Escolha"], ["sim-mapa", "Sim com mapa"], ["sim-endereco", "Sim só endereço"], ["bairro-cidade", "Não só bairro cidade"], ["nao-publico", "Não para público"]]],
      ["googleBusiness", "Google Meu Negócio", "input", "Cole o link do perfil no Google Maps"],
      ["businessHours", "Horário de funcionamento", "textarea", "Dias e horários de atendimento"],
    ]),
  },
  {
    id: "coverage",
    title: "Área de atendimento",
    kicker: "Cobertura",
    description: "Para atendimentos móveis, online ou sem endereço fixo, indique onde e como o cliente atende.",
    condition: () => ["C", "D"].includes(state.businessNature),
    render: () => fields([
      ["serviceArea", "Área de cobertura ou formato de atendimento", "textarea", "Ex: online para todo Brasil, domicílio em bairros específicos, delivery..."],
      ["businessHours", "Horário de atendimento", "textarea", "Dias, horários e regras de agendamento"],
    ]),
  },
  {
    id: "positioning",
    title: "Posicionamento",
    kicker: "Mensagem",
    description: "Aqui ficam as frases que ajudam a construir hero, chamadas e narrativa comercial.",
    render: () => fields([
      ["shortDescription", "Frase principal do negócio", "textarea", "Em uma frase, explique o que o negócio faz."],
      ["differentiator", "Maior diferencial", "textarea", "Por que alguém deveria escolher esse negócio?"],
      ["mustHaveMessage", "Mensagem que não pode faltar", "textarea", "Algo obrigatório no site."],
      ["clientVoiceQuote", "Frase na voz do cliente", "textarea", "Uma frase em primeira pessoa que represente o negócio."],
    ]),
  },
  {
    id: "conversion",
    title: "Conversão",
    kicker: "Objetivo",
    description: "Defina o que o site precisa gerar e qual ação deve receber mais destaque.",
    render: () => fields([
      ["mainGoal", "Objetivo principal do site", "select", "", goalOptions()],
      ["primaryCTA", "CTA principal", "select", "", ctaOptions()],
      ["priorityOffer", "Serviço ou produto prioritário", "textarea", "O que o site mais precisa vender, apresentar ou gerar?"],
      ["appointmentLink", "Link de agendamento ou compra", "input", "Calendly, WhatsApp, loja, agenda ou outro link"],
    ]),
  },
  {
    id: "audience",
    title: "Público",
    kicker: "Cliente ideal",
    description: "Essas respostas ajudam a definir copy, seções, prioridades e tom de comunicação.",
    render: () => fields([
      ["targetAudience", "Público-alvo principal", "textarea", "Descreva quem é o cliente ideal: perfil, região, necessidade e nível de decisão."],
      ["typicalProblem", "Problema típico do cliente", "textarea", "Qual dor, dúvida ou necessidade faz a pessoa procurar o negócio?"],
      ["typicalResult", "Resultado típico esperado", "textarea", "O que muda para o cliente depois de contratar/comprar?"],
      ["notFor", "Pra quem não é", "textarea", "Quem não é o público ideal ou o que o negócio não faz?"],
    ]),
  },
  {
    id: "m2-page",
    title: "Segunda página",
    kicker: "M2",
    description: "No M2, o cliente escolhe uma segunda página. O sistema não deve criar páginas extras sem necessidade.",
    condition: () => state.model === "M2",
    render: () => choiceCards("secondaryPage", [
      { value: "sobre", title: "Sobre nós", text: "História, autoridade, equipe e confiança." },
      { value: "servicos", title: "Serviços", text: "Lista mais completa de serviços, planos ou produtos." },
      { value: "contato", title: "Contato", text: "Mapa, canais, horários e chamada para atendimento." },
    ]),
  },
  {
    id: "story",
    title: "História",
    kicker: "Sobre",
    description: "Bloco usado principalmente em M2 e M4, mas também ajuda a dar profundidade ao conteúdo.",
    condition: () => ["M2", "M4"].includes(state.model),
    render: () => fields([
      ["story", "Como o negócio começou", "textarea", "Conte a origem, motivação e trajetória."],
      ["notFor", "Pra quem não é", "textarea", "Que tipo de cliente, pedido ou expectativa não combina?"],
      ["clientVoiceQuote", "Frase em primeira pessoa", "textarea", "Ex: Aqui, cada cliente é atendido com tempo e cuidado."],
    ]),
  },
  {
    id: "services",
    title: "Serviços",
    kicker: "Oferta",
    description: "Aparece para M1, M2 e M4. O sistema usa isso para montar cards, seções, CTAs e hierarquia de oferta.",
    condition: () => ["M1", "M2", "M4"].includes(state.model),
    render: () => fields([
      ["servicesItems", "Serviços, planos ou produtos", "textarea", "Liste nomes, descrições curtas e prioridades."],
      ["pricingDisplay", "Exibição de preços", "select", "", pricingOptions()],
      ["promotion", "Promoção ou condição especial", "textarea", "Alguma oferta, benefício, primeira consulta, pacote ou condição?"],
    ]),
  },
  {
    id: "portfolio",
    title: "Portfólio",
    kicker: "M3",
    description: "No M3, o eixo do site é a galeria, catálogo, produto, projeto ou portfólio.",
    condition: () => state.model === "M3",
    render: () => fields([
      ["portfolioType", "Tipo de galeria", "select", "", portfolioOptions()],
      ["portfolioCategories", "Categorias da galeria", "textarea", "Ex: residencial, comercial, eventos, produtos..."],
      ["portfolioMinItems", "Quantidade de itens na galeria", "input", "Ex: 12 projetos, 20 produtos, 8 fotos principais"],
      ["portfolioPricing", "Preços na galeria", "select", "", galleryPricingOptions()],
      ["portfolioItemsDescription", "Itens da galeria", "textarea", "Liste os principais itens, projetos, produtos ou trabalhos que devem aparecer."],
    ]),
  },
  {
    id: "team",
    title: "Equipe",
    kicker: "Pessoas",
    description: "Aparece para M2 e M4 quando o cliente quer apresentar equipe, responsáveis ou especialistas.",
    condition: () => ["M2", "M4"].includes(state.model),
    render: () => fields([
      ["teamSection", "Seção de equipe", "select", "", [["", "Escolha"], ["sim-fotos-bio", "Sim com fotos e bio"], ["sim-nomes", "Sim nomes e cargos"], ["nao-sozinho", "Não trabalho sozinho"], ["sem-destaque", "Tenho equipe sem destaque"]]],
      ["teamList", "Lista da equipe", "textarea", "Nome, cargo, bio curta e observações."],
    ]),
  },
  {
    id: "proof",
    title: "Prova social",
    kicker: "Confiança",
    description: "Depoimentos, números e credenciais ajudam o site a vender sem parecer genérico.",
    render: () => fields([
      ["testimonials", "Depoimentos", "textarea", "Cole depoimentos com nome, contexto e autorização se houver."],
      ["testimonialsPermission", "Permissão dos depoimentos", "select", "", [["", "Escolha"], ["nome-foto", "Nome e foto"], ["primeiro-nome", "Primeiro nome ou iniciais"], ["anonimo", "Anônimo"], ["nao-sei", "Não sei"]]],
      ["credibilityNumbers", "Números de credibilidade", "textarea", "Ex: clientes atendidos, anos de mercado, avaliações, capacidade..."],
      ["googleRating", "Avaliação no Google", "input", "Ex: 4,9 estrelas com 86 avaliações"],
      ["credentials", "Certificações, prêmios ou parcerias", "textarea", "Certificações, selos, parceiros, associações, formações."],
    ]),
  },
  {
    id: "blog",
    title: "Blog",
    kicker: "M4",
    description: "Quando ativo, o site final precisa receber o Blog Autônomo Jumper com painel administrativo.",
    condition: () => state.model === "M4",
    render: () => fields([
      ["blogMode", "Blog ou novidades", "select", "", [["", "Escolha"], ["blog-ativo", "Blog ativo"], ["novidades", "Novidades pontuais"], ["sem-blog", "Não por enquanto"]]],
      ["blogFrequency", "Frequência de publicação", "select", "", [["", "Escolha"], ["1-semana", "1 post por semana"], ["2-mes", "2 posts por mês"], ["1-mes", "1 post por mês"], ["irregular", "Irregular"]]],
      ["blogInitialPosts", "Conteúdo de 3 posts iniciais", "textarea", "Liste títulos, temas ou rascunhos dos 3 primeiros posts."],
      ["blogAdminPassword", "Senha inicial desejada para o painel", "input", "Opcional. Pode ser definida depois."],
    ]),
  },
  {
    id: "visual-references",
    title: "Referências",
    kicker: "Design",
    description: "Referências positivas e negativas orientam o Design System sem virar molde copiado.",
    render: () => fields([
      ["visualReferences", "Sites de referência positivos", "textarea", "Cole até 3 links e diga o que gosta em cada um."],
      ["avoidSite", "Site que não quer parecer", "textarea", "Cole 1 link ou descreva o que evitar."],
      ["personality", "Personalidade visual", "select", "", personalityOptions()],
      ["voiceTone", "Tom de voz", "select", "", voiceOptions()],
    ]),
  },
  {
    id: "visual-rules",
    title: "Cores e limites",
    kicker: "Identidade visual",
    description: "Essas preferências viram regras e restrições para a direção visual do cliente.",
    render: () => fields([
      ["primaryColor", "Cor principal", "input", "Nome, hex ou descrição"],
      ["secondaryColors", "Cores secundárias ou proibidas", "textarea", "Cores de apoio e cores que não devem aparecer."],
      ["forbiddenWords", "Palavras, temas ou promessas proibidas", "textarea", "Termos legais, promessas, frases ou abordagens que devem ser evitadas."],
      ["visualPreference", "Clima visual preferido", "select", "", [["", "Escolha"], ["claro", "Mais claro"], ["escuro", "Mais escuro"], ["equilibrado", "Equilibrado"], ["nao-sei", "Não sei, a Jumper pode recomendar"]]],
      ["animationPreference", "Animação", "select", "", [["", "Escolha"], ["nenhuma", "Nenhuma"], ["discreta", "Discreta"], ["media", "Média"], ["nao-sei", "Não sei"]]],
    ]),
  },
  {
    id: "assets",
    title: "Materiais",
    kicker: "Uploads",
    description: "Links principais de materiais, logo, manual e imagem de capa para orientar a curadoria de assets.",
    render: () => fields([
      ["materialsFolder", "Link da pasta principal de materiais", "input", "Drive, Dropbox, WeTransfer ou outro"],
      ["brandManualLink", "Manual de marca", "input", "Link ou arquivo enviado abaixo"],
      ["logoLink", "Logo", "input", "Link da logo ou envie arquivo abaixo"],
      ["heroImageLink", "Imagem de capa/hero", "input", "Link da imagem principal ou envie arquivo abaixo"],
    ]),
  },
  {
    id: "asset-upload",
    title: "Upload",
    kicker: "Materiais",
    description: "O cliente pode subir arquivos agora ou deixar indicado o que será enviado depois.",
    render: () => fields([
      ["usePexels", "Usar Pexels provisório?", "select", "", [["sim", "Sim usar Pexels"], ["nao", "Não usar Pexels"], ["fallback", "Só se faltar foto real"], ["nao-sei", "Não sei"]]],
      ["assetUploads", "Subir arquivos", "file", "Logo, manual, fotos, vídeos ou materiais", { multiple: true }],
      ["additionalImages", "Imagens adicionais do site", "file", "Fotos extras para serviços, equipe, ambiente, produtos, bastidores, galeria ou detalhes.", { multiple: true }],
      ["missingMaterials", "Materiais faltando", "textarea", "O que ainda será enviado depois?"],
    ]),
  },
  {
    id: "people-location-assets",
    title: "Fotos do negócio",
    kicker: "Assets por seção",
    description: "Fotos de pessoas, espaço físico e equipe ajudam o site a parecer real e específico.",
    render: () => fields([
      ["ownerPhotosFolder", "Fotos profissionais do responsável", "input", "M2/M3/M4 ou quando houver rosto/autoridade"],
      ["locationPhotosFolder", "Fotos do espaço físico", "input", "Aparece para negócios com endereço físico"],
      ["teamPhotosFolder", "Fotos da equipe", "input", "Se houver seção de equipe"],
    ]),
  },
  {
    id: "section-assets",
    title: "Fotos de seções",
    kicker: "Assets por seção",
    description: "Materiais por serviço, galeria, parceiros e vídeo institucional.",
    render: () => fields([
      ["servicesPhotosFolder", "Fotos dos serviços em ação", "input", "M1/M2/M4"],
      ["galleryFolder", "Fotos da galeria, catálogo ou portfólio", "input", "Obrigatório para M3"],
      ["partnerLogosFolder", "Logos de parceiros/certificadores", "input", "Opcional"],
      ["videoUrl", "Vídeo institucional", "input", "YouTube, Vimeo, Drive ou outro link"],
    ]),
  },
  {
    id: "domain",
    title: "Domínio",
    kicker: "Publicação",
    description: "Domínio e registrador orientam a preparação para publicação.",
    render: () => fields([
      ["domainStatus", "Domínio próprio", "select", "", [["", "Escolha"], ["sim-registrado", "Sim registrado"], ["tenho-nao-sei", "Tenho mas não sei onde"], ["quero-registrar", "Não tenho quero registrar"], ["nao-sei", "Não sei preciso de ajuda"]]],
      ["currentDomain", "Domínio atual", "input", "Ex: empresa.com.br"],
      ["registrar", "Registrador do domínio", "input", "Registro.br, GoDaddy, Hostinger..."],
      ["desiredDomain", "Domínio desejado", "input", "Ex: empresa.com.br"],
    ]),
  },
  {
    id: "integrations",
    title: "Integrações",
    kicker: "Técnico",
    description: "Marque tudo que o site precisa preparar. Quando o cliente não souber, o sistema registra como recomendação pendente.",
    render: () => `
      <div class="field-grid">
        <div class="field full">
          <div class="field-head">
            <span>01</span>
            <label>Integrações desejadas</label>
          </div>
          <div class="option-strip integrations-strip">
            ${checkboxPills("integrations", integrationOptions())}
          </div>
        </div>
      </div>
    `,
  },
  {
    id: "tracking",
    title: "Ferramentas atuais",
    kicker: "Técnico",
    description: "IDs e sistemas atuais ajudam a preparar analytics, pixels, agenda e CRM.",
    render: () => fields([
      ["pixelIds", "IDs de pixels, Analytics ou Ads", "textarea", "GA4, Meta Pixel, Google Ads ou outros IDs."],
      ["crmCurrent", "CRM, agenda ou plataforma atual", "textarea", "Calendly, Google Calendar, RD, HubSpot, WhatsApp Business, planilhas..."],
    ]),
  },
  {
    id: "finish",
    title: "Finalização",
    kicker: "Prazo",
    description: "Últimas informações antes de enviar o briefing para a Jumper.",
    render: () => fields([
      ["deadline", "Prazo desejado", "select", "", deadlineOptions()],
      ["pendingToStart", "Pendências para iniciar", "textarea", "Liste o que ainda precisa ser resolvido antes de começarmos com segurança."],
      ["bestContactTime", "Melhor horário para contato", "input", "Dias e horários preferidos"],
      ["finalNotes", "Informações finais", "textarea", "Contexto, pendências, cuidados, observações legais ou comerciais."],
    ]),
  },
  {
    id: "review",
    title: "Revisar",
    kicker: "Envio",
    description: "Confira os dados principais antes de enviar o briefing para a Jumper.",
    render: () => resultMarkup(),
  },
];

const stepContainer = document.querySelector("#step-container");
const stepCount = document.querySelector("#step-count");
const stepTitle = document.querySelector("#step-title");
const progressBar = document.querySelector("#progress-bar");
const summaryList = document.querySelector("#summary-list");
const summaryScore = document.querySelector("#summary-score");
const liveSummary = document.querySelector(".live-summary");
const prevButton = document.querySelector("#prev-button");
const nextButton = document.querySelector("#next-button");
const resetButton = document.querySelector("#reset-button");
const form = document.querySelector("#quiz-form");

function loadState() {
  try {
    return { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...initialState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function visibleSteps() {
  return steps.filter((step) => !step.condition || step.condition());
}

function currentVisibleStep() {
  const visible = visibleSteps();
  currentStep = Math.min(currentStep, visible.length - 1);
  return { visible, step: visible[currentStep] };
}

function fields(items, includeWrapper = true) {
  const markup = items.map(([name, label, type, placeholder, options], index) => fieldMarkup(name, label, type, placeholder, options, index)).join("");
  return includeWrapper ? `<div class="field-grid">${markup}</div>` : markup;
}

function fieldMarkup(name, label, type, placeholder, options, index) {
  const value = escapeHtml(state[name] || "");
  const number = String(index + 1).padStart(2, "0");
  let control = "";

  if (type === "textarea") {
    control = `<textarea id="${name}" name="${name}" placeholder="${placeholder}">${value}</textarea>`;
  } else if (type === "select") {
    control = `
      <select id="${name}" name="${name}">
        ${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${state[name] === optionValue ? "selected" : ""}>${optionLabel}</option>`).join("")}
      </select>
    `;
  } else if (type === "file") {
    const fileNames = state.uploadedFiles?.[name]?.length ? state.uploadedFiles[name].join(", ") : "Nenhum arquivo selecionado";
    control = `
      <input id="${name}" name="${name}" type="file" ${options?.multiple ? "multiple" : ""} />
      <p class="file-hint">${escapeHtml(fileNames)}</p>
    `;
  } else {
    control = `<input id="${name}" name="${name}" value="${value}" placeholder="${placeholder}" />`;
  }

  return `
    <div class="field ${type === "textarea" || type === "file" ? "full" : ""}">
      <div class="field-head">
        <span>${number}</span>
        <label for="${name}">${label}</label>
      </div>
      ${control}
    </div>
  `;
}

function choiceCards(name, options) {
  return `
    <div class="choice-grid">
      ${options.map((option) => `
        <label class="choice">
          <input type="radio" name="${name}" value="${option.value}" ${state[name] === option.value ? "checked" : ""} />
          <span class="choice-index">${option.value}</span>
          <strong>${option.title}</strong>
          <span class="choice-copy">${option.text}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function checkboxPills(name, options) {
  return options.map(([value, label]) => `
    <label class="pill">
      <input type="checkbox" name="${name}" value="${value}" ${state[name].includes(value) ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `).join("");
}

function resultMarkup() {
  const personality = personalities.find(([value]) => value === state.personality);
  const reviewItems = [
    ["Negócio", state.businessName || "Não informado"],
    ["Modelo", state.model ? `${state.model} - ${modelSummary(state.model)}` : "Não escolhido"],
    ["Natureza", businessNatureSummary(state.businessNature) || "Não escolhida"],
    ["Segmento", state.segment || "Não informado"],
    ["Objetivo", state.mainGoal || "Não informado"],
    ["CTA", state.primaryCTA || "Não escolhido"],
    ["Personalidade", personality ? `${personality[0]} - ${personality[1]}` : "Não escolhida"],
    ["Materiais", state.materialsFolder || state.logoLink || "Links ou uploads pendentes"],
  ];

  return `
    <div class="result-box">
      <div class="review-list">
        ${reviewItems.map(([label, value]) => `
          <div>
            <span>${label}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `).join("")}
      </div>
      ${submitStatus ? `<p class="submit-status ${submitStatus.type}">${escapeHtml(submitStatus.message)}</p>` : ""}
    </div>
  `;
}

function buildPayload() {
  const slug = slugify(state.businessName || "cliente-sem-nome");
  const hasBlog = state.model === "M4" && ["blog-ativo", "novidades"].includes(state.blogMode);

  return {
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
      model_confirmation: state.modelConfirmation.includes(state.model),
      business_nature: state.businessNature,
      secondary_page: state.model === "M2" ? state.secondaryPage : null,
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
        must_have_message: state.mustHaveMessage,
        client_voice_quote: state.clientVoiceQuote,
        story: state.story,
      },
      audience: {
        target: state.targetAudience,
        not_for: state.notFor,
        typical_problem: state.typicalProblem,
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
      final_notes: state.finalNotes,
    },
    site_factory_target: {
      client_folder: `_jumper-sites-system/clientes/${slug}/`,
      raw_entry_folder: `_jumper-sites-system/clientes/${slug}/briefing/entrada/`,
      expected_normalized_briefing: `_jumper-sites-system/clientes/${slug}/briefing/briefing-normalizado.md`,
    },
  };
}

function render() {
  const { visible, step } = currentVisibleStep();

  stepContainer.innerHTML = `
    <div class="step-layout">
      <header class="step-header">
        <span>${step.kicker}</span>
        <h2>${step.title}</h2>
        <p>${step.description}</p>
      </header>
      <div class="step-body">
        ${step.render()}
      </div>
    </div>
  `;

  stepCount.textContent = `Etapa ${currentStep + 1} de ${visible.length}`;
  stepTitle.textContent = "";
  progressBar.style.width = `${((currentStep + 1) / visible.length) * 100}%`;
  prevButton.disabled = currentStep === 0;
  nextButton.textContent = step.id === "review" ? "Enviar briefing" : "Continuar";

  renderSummary(visible);
}

function renderSummary(visible = visibleSteps()) {
  const personality = personalities.find(([value]) => value === state.personality);
  const requiredKeys = [
    "model", "businessNature", "businessName", "segment", "cityCoverage", "contactName", "whatsapp", "contactEmail",
    "shortDescription", "differentiator", "mainGoal", "primaryCTA", "priorityOffer", "personality",
    "visualReferences", "materialsFolder", "domainStatus",
  ];
  const completed = requiredKeys.filter((key) => {
    const value = state[key];
    return Array.isArray(value) ? value.length : Boolean(value);
  }).length;
  const score = Math.min(10, Math.round((completed / requiredKeys.length) * 100) / 10).toFixed(1);
  const summary = [
    ["modelo", "Modelo", state.model ? `${state.model} - ${modelSummary(state.model)}` : ""],
    ["natureza", "Operação", businessNatureSummary(state.businessNature)],
    ["briefing", "Negócio", state.businessName],
    ["contato", "Contato", state.whatsapp || state.contactEmail],
    ["local", "Atuação", state.cityCoverage || state.serviceArea],
    ["objetivo", "Objetivo", state.mainGoal],
    ["cta", "CTA", state.primaryCTA],
    ["publico", "Público", state.targetAudience],
    ["oferta", "Oferta", state.priorityOffer || state.servicesItems || state.portfolioType],
    ["prova", "Prova", state.testimonials || state.credibilityNumbers],
    ["estilo", "Estilo", personality ? personality[1] : ""],
    ["assets", "Materiais", state.materialsFolder || state.logoLink || fileSummary()],
    ["blog", "Blog", state.model === "M4" ? state.blogMode : ""],
    ["dominio", "Domínio", state.currentDomain || state.desiredDomain || state.domainStatus],
    ["status", "Próximo passo", currentStep === visible.length - 1 ? "Enviar briefing para a Jumper" : `Responder etapa ${currentStep + 1} de ${visible.length}`],
  ];

  summaryScore.textContent = `${score} /10`;
  summaryList.innerHTML = summary.map(([event, term, value]) => `
    <div class="${value ? "" : "is-pending"}">
      <span>${event}</span>
      <dt>${term}</dt>
      <dd>${escapeHtml(value || "***")}</dd>
    </div>
  `).join("");
}

function syncSummaryDisclosure() {
  if (!liveSummary) return;

  if (window.matchMedia("(max-width: 860px)").matches) {
    liveSummary.removeAttribute("open");
    return;
  }

  liveSummary.setAttribute("open", "");
}

function updateStateFromForm() {
  const formData = new FormData(form);
  const next = { ...state, uploadedFiles: { ...state.uploadedFiles } };

  Object.keys(initialState).forEach((key) => {
    if (Array.isArray(initialState[key])) {
      // A step only renders its own controls. Preserve selections from other steps;
      // an unchecked group on this step must still be allowed to become empty.
      if ([...form.elements].some((control) => control.name === key)) {
        next[key] = formData.getAll(key).map(String);
      }
    } else if (key !== "uploadedFiles" && formData.has(key)) {
      const value = formData.get(key);
      next[key] = typeof value === "string" ? value : "";
    }
  });

  form.querySelectorAll('input[type="file"]').forEach((input) => {
    const files = [...input.files].map((file) => file.name);
    if (files.length) next.uploadedFiles[input.name] = files;
  });

  state = next;
  saveState();
}

function resetQuiz() {
  state = { ...initialState, uploadedFiles: {} };
  currentStep = 0;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function advance(direction) {
  updateStateFromForm();
  const visible = visibleSteps();
  currentStep = Math.max(0, Math.min(visible.length - 1, currentStep + direction));
  render();
}

function modelSummary(model) {
  const found = models.find(([value]) => value === model);
  return found ? found[1] : model;
}

function modelDisplay(model) {
  return `Modelo de Site ${String(model).replace("M", "")}`;
}

function businessNatureSummary(value) {
  const found = businessNatures.find(([option]) => option === value);
  return found ? found[1] : "";
}

function fileSummary() {
  const files = Object.values(state.uploadedFiles || {}).flat();
  return files.length ? `${files.length} arquivo(s) selecionado(s)` : "";
}

function natureHelp(value) {
  const help = {
    A: "Pede endereço, mapa, horário e fotos do espaço.",
    B: "Pede endereço, agenda, mapa e horário de atendimento.",
    C: "Pede área de cobertura, agenda e formato de atendimento.",
    D: "Pede cobertura, entrega, remoto ou atendimento móvel.",
  };
  return help[value] || "";
}

function goalOptions() {
  return [["", "Escolha"], ["whatsapp", "Gerar WhatsApp"], ["agendamento", "Agendamento"], ["leads", "Captar leads"], ["venda", "Vender serviço ou produto"], ["autoridade", "Autoridade e confiança"], ["portfolio", "Portfolio ou catálogo"], ["institucional", "Institucional"]];
}

function ctaOptions() {
  return [["", "Escolha"], ["Chamar no WhatsApp", "Chamar no WhatsApp"], ["Agendar atendimento", "Agendar atendimento"], ["Pedir orçamento", "Pedir orçamento"], ["Comprar ou contratar", "Comprar ou contratar"], ["Ver catálogo", "Ver catálogo"], ["Conhecer serviços", "Conhecer serviços"]];
}

function pricingOptions() {
  return [["", "Escolha"], ["todos", "Todos os preços visíveis"], ["sem-precos", "Não exibir preços"], ["misto", "Misto"], ["faixa-a-partir", "Faixa a partir de"]];
}

function galleryPricingOptions() {
  return [["", "Escolha"], ["sim-valores", "Sim com valores"], ["nao-orcamento", "Não só orçamento"], ["alguns", "Alguns com preço"]];
}

function portfolioOptions() {
  return [["", "Escolha"], ["portfolio", "Portfolio de trabalhos"], ["catalogo", "Catálogo de produtos"], ["antes-depois", "Antes e depois"], ["fotos-videos", "Fotos e vídeos"]];
}

function personalityOptions() {
  return [["", "Escolha"], ...personalities.map(([value, title]) => [value, `${value} - ${title}`])];
}

function voiceOptions() {
  return [["", "Escolha"], ["formal-cortes", "Formal e cortês"], ["casual-amistoso", "Casual e amistoso"], ["direto-premium", "Direto e premium"], ["informal-regional", "Informal e regional"], ["objetivo-profissional", "Objetivo profissional"]];
}

function integrationOptions() {
  const base = [
    ["analytics", "Google Analytics"],
    ["whatsapp", "WhatsApp"],
    ["meta-pixel", "Meta Pixel"],
    ["google-ads", "Google Ads"],
    ["form-email", "Formulário por e-mail"],
    ["form-whatsapp", "Formulário para WhatsApp"],
    ["maps", "Google Maps"],
    ["none", "Nenhuma"],
    ["not-sure", "Não sei"],
  ];
  if (state.model !== "M1") {
    base.splice(7, 0, ["scheduler", "Agendamento online"], ["newsletter", "Newsletter/lista"], ["live-chat", "Chat ao vivo"]);
  }
  return base;
}

function deadlineOptions() {
  return [["", "Escolha"], ["sem-urgencia", "Sem urgência"], ["7-dias", "Até 7 dias"], ["15-dias", "Até 15 dias"], ["30-dias", "Até 30 dias"], ["data-especifica", "Data específica"]];
}

function modelConfirmationLabel(model) {
  const labels = {
    M1: "Confirmo que este briefing é para Site One Page",
    M2: "Confirmo que este briefing é para Site com Duas Páginas",
    M3: "Confirmo que este briefing é para Portfólio ou Catálogo",
    M4: "Confirmo que este briefing é para Site Completo Local",
  };
  return labels[model] || "Confirmo o modelo contratado";
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("input", () => {
  updateStateFromForm();
  renderSummary();
});

form.addEventListener("change", (event) => {
  updateStateFromForm();

  if (["model", "businessNature"].includes(event.target.name)) {
    const { visible } = currentVisibleStep();
    currentStep = Math.min(currentStep, visible.length - 1);
    render();
    return;
  }

  renderSummary();
});

prevButton.addEventListener("click", () => advance(-1));

nextButton.addEventListener("click", async () => {
  updateStateFromForm();
  const { visible, step } = currentVisibleStep();

  if (step.id !== "review") {
    currentStep = Math.min(visible.length - 1, currentStep + 1);
    render();
    return;
  }

  await submitBriefing();
});

resetButton.addEventListener("click", resetQuiz);

window.addEventListener("resize", syncSummaryDisclosure);
syncSummaryDisclosure();
render();

async function submitBriefing() {
  const payload = buildPayload();

  nextButton.disabled = true;
  nextButton.textContent = "Enviando...";
  submitStatus = { type: "pending", message: "Enviando briefing para a Jumper..." };
  render();

  try {
    const response = await fetch("/api/briefings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Não foi possível enviar o briefing.");
    }

    submitStatus = {
      type: "success",
      message: "Briefing recebido pela Jumper. Nossa equipe irá conferir os dados e os materiais para dar continuidade ao projeto.",
    };
    console.info("Briefing salvo", data);
  } catch (error) {
    submitStatus = { type: "error", message: `Não foi possível enviar agora. ${error.message}` };
    console.error("Erro ao enviar briefing", error, payload);
  } finally {
    nextButton.disabled = false;
    render();
  }
}
