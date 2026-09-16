import { reviewBriefingContent } from "./content-review.mjs";
import { validateGuidedIntake } from "./intake-validation.mjs";
import { validateM5Intake } from "./m5-validation.mjs";
const NOTION_VERSION = "2022-06-28";

export async function createNotionBriefingPage(payload, config = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      typeof payload.client?.name !== "string" || !payload.client.name.trim() ||
      !["M1", "M2", "M3", "M4", "M5"].includes(payload.project_scope?.model) ||
      !payload.created_at || !Number.isFinite(Date.parse(payload.created_at))) {
    const error = new Error("Confira nome do negócio, modelo e data de envio do briefing.");
    error.code = "invalid_briefing";
    error.status = 400;
    throw error;
  }
  const guidedErrors = validateGuidedIntake(payload);
  if (guidedErrors.length) { const error = new Error(guidedErrors.join(" ")); error.status = 400; error.code = "invalid_briefing"; throw error; }
  const m5Errors = validateM5Intake(payload);
  if (m5Errors.length) {
    const error = new Error(m5Errors.join(" ")); error.status = 400; error.code = "invalid_m5_briefing"; throw error;
  }
  const notionToken = config.notionToken || process.env.NOTION_TOKEN || "";
  const databaseId = config.databaseId || process.env.NOTION_DATABASE_ID || "370db609496880e28cbfce7472169134";

  if (!notionToken) {
    const error = new Error("Defina NOTION_TOKEN para criar páginas no Notion.");
    error.code = "notion_not_configured";
    error.status = 501;
    throw error;
  }

  if (payload.project_scope?.model === "M5") {
    payload = { ...payload, project_scope: { ...payload.project_scope, reformulation: { ...payload.project_scope.reformulation, scope_status: "pending_review" } } };
  }
  if(payload.briefing_depth==='strategic-v3') {
    const review=reviewBriefingContent(payload);
    const pending=Array.isArray(payload.production_handoff?.pending_decisions)?payload.production_handoff.pending_decisions.filter(x=>typeof x==='string'):[];
    payload={...payload,production_handoff:{...payload.production_handoff,status:'needs_review',content_review:review,pending_decisions:[...new Set([...pending,...review.issues])]}};
  }
  const notionPayload = {
    parent: { database_id: databaseId },
    properties: mapPayloadToNotionProperties(payload),
    children: buildImportBlocks(payload),
  };

  if (notionPayload.children.length > 100 || Buffer.byteLength(JSON.stringify(notionPayload)) > 450000) {
    const error = new Error("Briefing muito extenso. Envie os materiais por link de pasta e reduza os textos.");
    error.code = "briefing_too_large";
    error.status = 413;
    throw error;
  }

  const notionResponse = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify(notionPayload),
  });

  const data = await notionResponse.json();

  if (!notionResponse.ok) {
    const error = new Error(data.message || "Erro ao criar página no Notion.");
    error.code = "notion_error";
    error.status = notionResponse.status;
    error.details = data;
    throw error;
  }

  return {
    notion_page_id: data.id,
    notion_url: data.url,
  };
}

export function mapPayloadToNotionProperties(payload) {
  const model = payload.project_scope?.model || "";
  const properties = {
    "Nome do Negócio": title(payload.client?.name),
    "Modelo contratado": select(modelSelect(model)),
    Status: select("🆕 Novo"),
    "Natureza do negócio": select(businessNatureSelect(payload.project_scope?.business_nature)),
    "Segmento principal": richText(payload.client?.segment),
    "Cidade e atuação": richText(payload.location?.city_coverage || payload.location?.service_area),
    "Responsável principal": richText(payload.client?.contact?.responsible),
    "WhatsApp principal": phone(payload.client?.contact?.whatsapp),
    "E-mail principal": email(payload.client?.contact?.email),
    Instagram: richText(payload.client?.social?.instagram),
    "Telefone fixo": phone(payload.client?.contact?.phone),
    Facebook: url(payload.client?.social?.facebook),
    LinkedIn: url(payload.client?.social?.linkedin),
    "Ano de fundação": richText(payload.client?.founded_year),
    CNPJ: richText(payload.client?.document),
    "Endereço completo": richText(payload.location?.address),
    "Exibição do endereço": select(addressDisplaySelect(payload.location?.show_address)),
    "Google Meu Negócio": url(payload.location?.google_business),
    "Horário de funcionamento": richText(payload.location?.business_hours),
    "Frase principal do negócio": richText(payload.content?.positioning?.short_description),
    "Maior diferencial": richText(payload.content?.positioning?.differentiator),
    "Mensagem que não pode faltar": richText(payload.content?.positioning?.must_have_message),
    "Como o negócio começou": richText(payload.content?.positioning?.story),
    "Pra quem não é": richText(payload.content?.audience?.not_for),
    "Problema típico do cliente": richText(payload.content?.audience?.typical_problem),
    "Resultado típico do cliente": richText(payload.content?.audience?.typical_result),
    "Frase na voz do cliente": richText(payload.content?.positioning?.client_voice_quote),
    "Objetivo principal do site": select(goalSelect(payload.content?.conversion?.main_goal)),
    "CTA principal": select(payload.content?.conversion?.primary_cta),
    "Serviço ou produto prioritário": richText(payload.content?.conversion?.priority_offer),
    "Link de agendamento": url(payload.content?.conversion?.appointment_link),
    "Público-alvo principal": richText(payload.content?.audience?.target),
    "Segunda página M2": model === "M2" ? select(secondaryPageSelect(payload.project_scope?.secondary_page)) : undefined,
    "Serviços planos produtos": richText(payload.content?.services?.items_raw),
    "Exibição de preços": select(pricingSelect(payload.content?.services?.pricing_mode)),
    "Promoção para novos clientes": richText(payload.content?.services?.promotion),
    "Tipo de galeria": select(portfolioTypeSelect(payload.content?.portfolio?.mode)),
    "Categorias da galeria": richText(payload.content?.portfolio?.categories_raw),
    "Quantidade de itens na galeria": richText(payload.content?.portfolio?.minimum_items),
    "Preços na galeria": select(galleryPricingSelect(payload.content?.portfolio?.pricing_mode)),
    "Itens da galeria": richText(payload.content?.portfolio?.items_description),
    "Seção de equipe": select(teamSelect(payload.content?.team?.enabled)),
    "Lista da equipe": richText(payload.content?.team?.members_raw),
    Depoimentos: richText(payload.content?.social_proof?.testimonials_raw),
    "Permissão dos depoimentos": select(testimonialsPermissionSelect(payload.content?.social_proof?.testimonials_permission)),
    "Números de credibilidade": richText(payload.content?.social_proof?.stats_raw),
    "Avaliação no Google": richText(payload.content?.social_proof?.google_rating),
    "Certificações prêmios parcerias": richText(payload.content?.social_proof?.credentials_raw),
    "Blog ou novidades": select(blogSelect(payload.content?.blog?.mode)),
    "Frequência de publicação": select(frequencySelect(payload.content?.blog?.frequency)),
    "Conteúdo de posts iniciais": richText(payload.content?.blog?.initial_posts_raw),
    "Sites de referência": richText(payload.creative_direction?.visual_references),
    "Site que não quer parecer": url(payload.creative_direction?.avoid_site),
    "Personalidade visual": select(personalitySelect(payload.creative_direction?.personality)),
    "Tom de voz": select(voiceSelect(payload.creative_direction?.voice_tone)),
    "Cor principal": richText(payload.creative_direction?.primary_color),
    "Cores secundárias ou proibidas": richText(payload.creative_direction?.secondary_or_forbidden_colors),
    "Palavras ou temas proibidos": richText(payload.creative_direction?.forbidden_words_or_themes),
    "Link da pasta de imagens e materiais": url(payload.assets?.materials_folder),
    "Materiais faltando": richText(payload.assets?.missing_notes),
    "Usar Pexels provisório": select(pexelsSelect(payload.project_scope?.pexels_mode, payload.project_scope?.use_pexels_as_placeholder)),
    "Domínio próprio": select(domainSelect(payload.domain?.status)),
    "Domínio atual": richText(payload.domain?.current),
    "Registrador do domínio": richText(payload.domain?.registrar),
    "Domínio desejado": richText(payload.domain?.desired),
    "Integrações desejadas": multiSelect((payload.integrations?.selected || []).map(integrationSelect)),
    "IDs de pixels": richText(payload.integrations?.pixel_ids_raw),
    "CRM ou sistema atual": richText(payload.integrations?.crm_current),
    "Prazo desejado": select(deadlineSelect(payload.operations?.deadline)),
    "Pendências para iniciar": richText(payload.intake_version === "guided-v1" ? (payload.production_handoff?.pending_decisions || []).join("\n") : payload.operations?.pending_to_start),
    "Informações finais": richText(payload.operations?.final_notes),
    "Melhor horário para contato": richText(payload.operations?.best_contact_time),
    "Confirmo que este briefing é para Site One Page": checkbox(model === "M1" && payload.project_scope?.model_confirmation),
    "Confirmo que este briefing é para Site com Duas Páginas": checkbox(model === "M2" && payload.project_scope?.model_confirmation),
    "Confirmo que este briefing é para Portfólio ou Catálogo": checkbox(model === "M3" && payload.project_scope?.model_confirmation),
    "Confirmo que este briefing é para Site Completo Local": checkbox(model === "M4" && payload.project_scope?.model_confirmation),
  };

  if (model === "M5") {
    const reformulation = payload.project_scope.reformulation;
    properties["Site atual M5"] = url(reformulation.existing_site_url);
    properties["Motivo da reformulação M5"] = richText(reformulation.reason);
    properties["Problemas atuais M5"] = richText(reformulation.problems);
    properties["Preservar M5"] = richText(reformulation.preserve);
    properties["Atualizar M5"] = richText(reformulation.change);
    properties["Retirar M5"] = richText(reformulation.remove);
    properties["Acrescentar M5"] = richText(reformulation.add);
    properties["Páginas solicitadas M5"] = richText(reformulation.requested_pages);
    properties["Funcionalidades atuais M5"] = richText(reformulation.existing_features);
    properties["URLs importantes M5"] = richText(reformulation.important_urls);
    properties["Acessos e materiais M5"] = richText(reformulation.access_notes);
    properties["Confirmo que este briefing é para Reformulação de Site Institucional Local"] = checkbox(payload.project_scope.model_confirmation);
  }

  if (payload.intake_version === "guided-v1") {
    properties["Preferência de imagens IA"] = select({sim:"Pode criar para aprovação",nao:"Não autorizado","nao-sei":"Quero orientação"}[payload.assets?.ai_placeholder_permission]);
    properties["Disponibilidade de materiais"] = select({link:"Link compartilhado",later:"Envio posterior",existing:"Aproveitar site atual"}[payload.assets?.availability]);
  }
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value));
}

function buildImportBlocks(payload) {
  const normalizedPayload = normalizePayloadForImport(payload);
  const payloadJson = JSON.stringify(normalizedPayload, null, 2);
  const briefing = renderNormalizedBriefing(normalizedPayload);

  return [
    headingBlock("Briefing completo para importacao"),
    paragraphBlock(
      "Fonte oficial temporaria: Notion. A pasta do cliente no Site Factory deve ser criada somente quando este briefing for importado para _jumper-sites-system/clientes/[slug]/."
    ),
    ...chunkedCodeBlocks("JUMPER_PAYLOAD_JSON", payloadJson, "json"),
    headingBlock("Briefing normalizado"),
    ...chunkedCodeBlocks("JUMPER_NORMALIZED_BRIEFING_MD", briefing, "markdown"),
  ];
}

function normalizePayloadForImport(payload = {}) {
  const clientName = clean(payload.client?.name) || "Cliente sem nome";
  const slug = slugify(payload.client?.slug || clientName) || "cliente-sem-nome";

  return {
    ...payload,
    client: {
      ...(payload.client || {}),
      name: clientName,
      slug,
    },
    site_factory_target: {
      client_folder: `_jumper-sites-system/clientes/${slug}/`,
      raw_entry_folder: `_jumper-sites-system/clientes/${slug}/briefing/entrada/`,
      expected_normalized_briefing: `_jumper-sites-system/clientes/${slug}/briefing/briefing-normalizado.md`,
    },
  };
}

function headingBlock(content) {
  return {
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: [{ type: "text", text: { content } }] },
  };
}

function paragraphBlock(content) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content } }] },
  };
}

function chunkedCodeBlocks(marker, content, language) {
  const chunks = chunkText(content, 1700);
  return chunks.map((part, index) => ({
    object: "block",
    type: "code",
    code: {
      language,
      rich_text: [
        {
          type: "text",
          text: { content: `${marker}_PART ${index + 1}/${chunks.length}\n${part}` },
        },
      ],
    },
  }));
}

function chunkText(value, size) {
  const text = String(value || "");
  const chunks = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks.length ? chunks : [""];
}

function renderNormalizedBriefing(payload) {
  const rows = [
    ["Cliente", payload.client?.name],
    ["Slug", payload.client?.slug],
    ["Segmento", payload.client?.segment],
    ["Modelo contratado", payload.project_scope?.model],
    ["Modelo confirmado", payload.project_scope?.model_confirmation ? "Sim" : "Não"],
    ["Natureza do negócio", payload.project_scope?.business_nature],
    ["Personalidade visual", payload.creative_direction?.personality],
    ["Tom de voz", payload.creative_direction?.voice_tone],
    ["Fotos de banco", pexelsSelect(payload.project_scope?.pexels_mode, payload.project_scope?.use_pexels_as_placeholder) || "A confirmar"],
    ["Blog ativo", payload.project_scope?.has_blog ? "Sim" : "Não"],
    ["Cidade / cobertura", payload.location?.city_coverage || payload.location?.service_area],
    ["Endereço", payload.location?.address],
    ["WhatsApp", payload.client?.contact?.whatsapp],
    ["E-mail", payload.client?.contact?.email],
    ["Responsável", payload.client?.contact?.responsible],
  ];

  return `# Briefing Normalizado — ${clean(payload.client?.name) || "Cliente sem nome"}

Gerado automaticamente a partir do formulário público da Jumper.

## Identificação

${rows.map(([label, value]) => `- **${label}:** ${clean(value) || "Não informado"}`).join("\n")}

${payload.project_scope?.model === "M5" ? `## Reformulação M5\n\nEscopo pendente de análise e aprovação.\n\n${Object.entries(payload.project_scope.reformulation || {}).map(([key, value]) => `- **${key}:** ${clean(value) || "Não informado"}`).join("\n")}\n` : ""}

${payload.intake_version === "guided-v1" ? `## Complementação pela Jumper\n\nEstas respostas são a entrada inicial, não uma aprovação de arquitetura.\n\n${(payload.production_handoff?.pending_decisions || []).map(item => `- ${item}`).join("\n")}\n\n- Contatos do projeto podem ser publicados: ${payload.operations?.contact_publication || "A confirmar"}\n- Contato público alternativo: ${payload.operations?.public_contact || "Não informado"}\n- Materiais: ${payload.assets?.availability || "A confirmar"}\n- Site de origem dos materiais: ${payload.assets?.existing_site_url || payload.project_scope?.reformulation?.existing_site_url || "Não informado"}\n- Imagens de IA: ${payload.assets?.ai_placeholder_permission || "A confirmar"}\n- Fotos de banco: ${payload.project_scope?.pexels_mode || "A confirmar"}\n` : ""}

## Posicionamento

- **Descrição curta:** ${clean(payload.content?.positioning?.short_description) || "Não informado"}
- **Exemplo do diferencial:** ${clean(payload.content?.positioning?.differentiator_evidence) || "A levantar com o cliente"}
- **Diferencial:** ${clean(payload.content?.positioning?.differentiator) || "Não informado"}
- **Mensagem obrigatória:** ${clean(payload.content?.positioning?.must_have_message) || "Não informado"}
- **Frase na voz do cliente:** ${clean(payload.content?.positioning?.client_voice_quote) || "Não informado"}
- **História:** ${clean(payload.content?.positioning?.story) || "Não informado"}

## Público e Conversão

- **Público-alvo:** ${clean(payload.content?.audience?.target) || "Não informado"}
- **Pra quem não é:** ${clean(payload.content?.audience?.not_for) || "Não informado"}
- **Dúvidas e respostas do público:** ${clean(payload.content?.audience?.questions_raw) || "A levantar com o cliente"}
- **Problema típico:** ${clean(payload.content?.audience?.typical_problem) || "Não informado"}
- **Resultado típico:** ${clean(payload.content?.audience?.typical_result) || "Não informado"}
- **Objetivo principal:** ${clean(payload.content?.conversion?.main_goal) || "Não informado"}
- **CTA principal:** ${clean(payload.content?.conversion?.primary_cta) || "Não informado"}
- **Oferta prioritária:** ${clean(payload.content?.conversion?.priority_offer) || "Não informado"}
- **Link de agendamento:** ${clean(payload.content?.conversion?.appointment_link) || "Não informado"}

## Serviços, Produtos e Prova Social

- **Serviços / produtos:** ${clean(payload.content?.services?.items_raw) || "Não informado"}
- **Como funciona:** ${clean(payload.content?.services?.process_raw) || "A levantar com o cliente"}
- **Valores e condições para conferir:** ${clean(payload.content?.services?.pricing_details) || "Não informado ou não se aplica"}
- **Modo de preço:** ${clean(payload.content?.services?.pricing_mode) || "Não informado"}
- **Promoção:** ${clean(payload.content?.services?.promotion) || "Não informado"}
- **Disponibilidade de avaliações:** ${clean(payload.content?.social_proof?.testimonials_available) || "Não informado"}
- **Autorização dos depoimentos:** ${clean(payload.content?.social_proof?.testimonials_permission) || "A confirmar antes da publicação"}
- **Depoimentos:** ${clean(payload.content?.social_proof?.testimonials_raw) || "Não informado"}
- **Números de credibilidade:** ${clean(payload.content?.social_proof?.stats_raw) || "Não informado"}
- **Credenciais / prêmios / parcerias:** ${clean(payload.content?.social_proof?.credentials_raw) || "Não informado"}

## Estrutura e Conteúdo por Modelo

- **Segunda página M2:** ${payload.project_scope?.model === "M2" ? clean(payload.project_scope?.secondary_page) || "A definir" : "Não se aplica"}
- **Finalidade e conteúdo da segunda página:** ${clean(payload.project_scope?.secondary_page_goal) || "Não informado ou não se aplica"}
- **Galeria solicitada:** ${clean(payload.production_handoff?.requested_modules?.gallery) || "A conferir no escopo"}
- **Tipo de galeria:** ${clean(payload.content?.portfolio?.mode) || "Não informado"}
- **Itens da galeria:** ${clean(payload.content?.portfolio?.items_description) || "Não informado"}
- **Quantidade de itens:** ${clean(payload.content?.portfolio?.minimum_items) || "Não informado"}
- **Categorias:** ${clean(payload.content?.portfolio?.categories_raw) || "Não informado"}
- **Preços da galeria:** ${clean(payload.content?.portfolio?.pricing_mode) || "A definir"}
- **Equipe solicitada:** ${clean(payload.production_handoff?.requested_modules?.team) || clean(payload.content?.team?.enabled) || "A conferir no escopo"}
- **Pessoas e funções:** ${clean(payload.content?.team?.members_raw) || "Não informado"}
- **Publicações:** ${clean(payload.content?.blog?.mode) || "A conferir no escopo"}
- **Frequência:** ${clean(payload.content?.blog?.frequency) || "Não informado"}
- **Temas e textos iniciais:** ${clean(payload.content?.blog?.initial_posts_raw) || "Não informado"}
- **Agendamento solicitado:** ${clean(payload.production_handoff?.requested_modules?.booking) || "A conferir no escopo"}

${payload.production_handoff?.content_review ? `## Revisão editorial antes da construção

${payload.production_handoff.content_review.rule}

${payload.production_handoff.content_review.issues.map(issue=>`- ${issue}`).join("\n") || "- Revisar adequação e veracidade das respostas; ausência de alertas automáticos não aprova conteúdo."}
` : ""}

## Direção Visual

- **Referências visuais:** ${clean(payload.creative_direction?.visual_references) || "Não informado"}
- **Não parecer com:** ${clean(payload.creative_direction?.avoid_site) || "Não informado"}
- **Cor principal:** ${clean(payload.creative_direction?.primary_color) || "Não informado"}
- **Cores secundárias ou proibidas:** ${clean(payload.creative_direction?.secondary_or_forbidden_colors) || "Não informado"}
- **Palavras ou temas proibidos:** ${clean(payload.creative_direction?.forbidden_words_or_themes) || "Não informado"}
- **Preferência visual:** ${clean(payload.creative_direction?.visual_preference) || "Não informado"}
- **Preferência de animação:** ${clean(payload.creative_direction?.animation_preference) || "Não informado"}

## Assets

- **Pasta de materiais:** ${clean(payload.assets?.materials_folder) || "Não informado"}
- **Manual da marca:** ${clean(payload.assets?.brand_manual_link) || "Não informado"}
- **Logo:** ${clean(payload.assets?.logo_link) || "Não informado"}
- **Imagem hero:** ${clean(payload.assets?.hero_image_link) || "Não informado"}
- **Fotos do responsável:** ${clean(payload.assets?.owner_photos_folder) || "Não informado"}
- **Fotos do espaço:** ${clean(payload.assets?.location_photos_folder) || "Não informado"}
- **Fotos da equipe:** ${clean(payload.assets?.team_photos_folder) || "Não informado"}
- **Fotos de serviços:** ${clean(payload.assets?.services_photos_folder) || "Não informado"}
- **Galeria:** ${clean(payload.assets?.gallery_folder) || "Não informado"}
- **Materiais faltando:** ${clean(payload.assets?.missing_notes) || "Não informado"}

## Operação e Domínio

- **Instagram:** ${clean(payload.client?.social?.instagram) || "Não informado"}
- **Perfil público Google:** ${clean(payload.location?.google_business) || "Não informado"}
- **Horários:** ${clean(payload.location?.business_hours) || "A confirmar"}
- **Domínio:** ${clean(payload.domain?.status) || "Não informado"}
- **Domínio atual:** ${clean(payload.domain?.current) || "Não informado"}
- **Domínio desejado:** ${clean(payload.domain?.desired) || "Não informado"}
- **Integrações:** ${(payload.integrations?.selected || []).join(", ") || "Não informado"}
- **Prazo:** ${clean(payload.operations?.deadline) || "Não informado"}
- **Pendências:** ${clean(payload.operations?.pending_to_start) || "Não informado"}
- **Melhor horário para contato:** ${clean(payload.operations?.best_contact_time) || "Não informado"}
- **Informações finais:** ${clean(payload.operations?.final_notes) || "Não informado"}
`;
}

function title(value) {
  return { title: [{ text: { content: clean(value) || "Cliente sem nome" } }] };
}

function richText(value) {
  const content = clean(value);
  return content ? { rich_text: [{ text: { content: limit(content, 1900) } }] } : undefined;
}

function select(value) {
  const name = clean(value);
  return name ? { select: { name } } : undefined;
}

function multiSelect(values) {
  const names = values.map(clean).filter(Boolean);
  return names.length ? { multi_select: names.map((name) => ({ name })) } : undefined;
}

function url(value) {
  const content = clean(value);
  return content ? { url: content } : undefined;
}

function email(value) {
  const content = clean(value);
  return content ? { email: content } : undefined;
}

function phone(value) {
  const content = clean(value);
  return content ? { phone_number: content } : undefined;
}

function checkbox(value) {
  return { checkbox: Boolean(value) };
}

function clean(value) {
  return String(value || "").trim();
}

function limit(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function modelSelect(model) {
  return { M1: "M1 One Page", M2: "M2 Duas Páginas", M3: "M3 Portfolio", M4: "M4 Completo Local", M5: "M5 Reformulação Institucional" }[model] || "";
}

function businessNatureSelect(value) {
  return {
    A: "A - Espaço físico aberto",
    B: "B - Atendimento por agendamento",
    C: "C - Autônomo online ou externo",
    D: "D - Remoto delivery móvel",
  }[value] || "";
}

function addressDisplaySelect(value) {
  return {
    "sim-mapa": "Sim com mapa",
    "sim-endereco": "Sim só endereço",
    "bairro-cidade": "Não só bairro cidade",
    "nao-publico": "Não para público",
  }[value] || "";
}

function secondaryPageSelect(value) {
  return { sobre: "Sobre nós", servicos: "Serviços", contato: "Contato", outra: "Outra página a definir" }[value] || "";
}

function goalSelect(value) {
  if (value === "nao-sei") return "";
  return {
    whatsapp: "Gerar WhatsApp",
    agendamento: "Agendamento",
    leads: "Captar leads",
    venda: "Vender serviço ou produto",
    autoridade: "Autoridade e confiança",
    portfolio: "Portfolio ou catálogo",
    institucional: "Institucional",
  }[value] || value;
}

function pricingSelect(value) {
  return {
    todos: "Todos os preços visíveis",
    "sem-precos": "Não exibir preços",
    misto: "Misto",
    "faixa-a-partir": "Faixa a partir de",
  }[value] || "";
}

function portfolioTypeSelect(value) {
  return {
    portfolio: "Portfolio de trabalhos",
    catalogo: "Catálogo de produtos",
    "antes-depois": "Antes e depois",
    "fotos-videos": "Fotos e vídeos",
  }[value] || "";
}

function galleryPricingSelect(value) {
  return {
    "sim-valores": "Sim com valores",
    "nao-orcamento": "Não só orçamento",
    alguns: "Alguns com preço",
  }[value] || "";
}

function teamSelect(value) {
  return {
    "sim-fotos-bio": "Sim com fotos e bio",
    "sim-nomes": "Sim nomes e cargos",
    "nao-sozinho": "Não trabalho sozinho",
    "sem-destaque": "Tenho equipe sem destaque",
  }[value] || "";
}

function testimonialsPermissionSelect(value) {
  return {
    "nome-foto": "Nome completo e foto",
    "primeiro-nome": "Primeiro nome ou iniciais",
    anonimo: "Anônimos",
  }[value] || value;
}

function blogSelect(value) {
  return {
    "blog-ativo": "Blog ativo",
    novidades: "Novidades pontuais",
    "sem-blog": "Não por enquanto",
  }[value] || "";
}

function frequencySelect(value) {
  return {
    "1-semana": "1 post por semana",
    "2-mes": "2 posts por mês",
    "1-mes": "1 post por mês",
    irregular: "Irregular",
  }[value] || "";
}

function personalitySelect(value) {
  return {
    A: "A Acolhedor familiar",
    B: "B Premium sofisticado",
    C: "C Energético vibrante",
    D: "D Técnico confiável",
    E: "E Artesanal autêntico",
    F: "F Moderno descolado",
  }[value] || "";
}

function voiceSelect(value) {
  return {
    "formal-cortes": "Formal e cortês",
    "casual-amistoso": "Casual e amistoso",
    "direto-premium": "Direto e premium",
    "informal-regional": "Informal e regional",
    "objetivo-profissional": "Objetivo profissional",
  }[value] || "";
}

function pexelsSelect(mode, fallbackBoolean) {
  return {
    sim: "Sim usar Pexels",
    nao: "Não usar Pexels",
    fallback: "Só se faltar foto real",
    "nao-sei": "Não sei",
  }[mode] || (fallbackBoolean ? "Sim usar Pexels" : "Não usar Pexels");
}

function domainSelect(value) {
  return {
    "sim-registrado": "Sim registrado",
    "tenho-nao-sei": "Tenho mas não sei onde",
    "quero-registrar": "Não tenho quero registrar",
    "nao-sei": "Não sei preciso de ajuda",
  }[value] || "";
}

function integrationSelect(value) {
  return {
    analytics: "Google Analytics",
    whatsapp: "WhatsApp",
    "meta-pixel": "Meta Pixel",
    "google-ads": "Google Ads",
    "form-email": "Formulário por e-mail",
    "form-whatsapp": "Formulário para WhatsApp",
    scheduler: "Agendamento online",
    maps: "Google Maps",
    newsletter: "Newsletter",
    "live-chat": "Chat ao vivo",
    none: "Nenhuma",
    "not-sure": "Não sei",
  }[value] || value;
}

function deadlineSelect(value) {
  return {
    "sem-urgencia": "Sem urgência",
    "7-dias": "Até 7 dias",
    "15-dias": "Até 15 dias",
    "30-dias": "Até 30 dias",
    "data-especifica": "Data específica",
  }[value] || "";
}

function slugify(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
