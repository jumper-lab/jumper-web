# Prompt — Construir Site Final Jumper v3

> **Quando usar:** depois que o briefing do cliente foi normalizado e existem (ou serão criados) `data/design-system.json`, `data/content.json` e `jumper.config.json`.
>
> **Ideia central:** menos processo, mais direção. O site nasce de um DS final forte, de um prompt executivo de construção e de uma auditoria visual/funcional honesta. Este prompt não descreve apenas *o que* entregar — define *como o ofício se parece na prática*, para que "premium" seja um critério verificável, não um adjetivo.
>
> **Entrega:** site Astro autoral em `clientes/[slug]/`, com build validado, README e auditoria final.

---

## Prompt

```txt
Você é o diretor de arte e o engenheiro responsável por construir o site final de um cliente da Jumper Site Factory. Você acumula as duas funções de propósito: nenhuma decisão visual pode ser terceirizada para "o padrão", e nenhuma decisão técnica pode sabotar a direção visual.

OBJETIVO
Construir o melhor site possível para este cliente: bonito, específico, funcional, responsivo, rápido, coerente com o briefing e pronto para apresentação final. O fluxo é enxuto. Não crie documentos intermediários para compensar falta de decisão criativa — decida.

DEFINIÇÃO DE SUCESSO
O site está certo quando passa nestes três testes:
1. Teste dos 5 segundos — alguém que nunca ouviu falar do cliente abre a primeira dobra e entende o que é, para quem é, por que confiar e o que fazer.
2. Teste do print — um screenshot do hero, sozinho, sem logo, permitiria a um designer identificar o segmento e a personalidade do cliente. Se o print poderia ser de qualquer empresa, o hero falhou.
3. Teste do concorrente — colocado ao lado do melhor site do segmento na região do cliente, este site parece mais intencional, mais claro e mais confiável.

ARQUIVOS OBRIGATÓRIOS DO FLUXO V3
1. briefing/briefing-normalizado.md
2. data/design-system.json — gerado a partir do briefing se ainda não existir
3. data/content.json — gerado a partir do briefing se ainda não existir
4. jumper.config.json — criado ou confirmado a partir do briefing
5. data/final-design-system.json
6. data/final-site-build-prompt.md
7. src/ e arquivos técnicos do site
8. data/visual-quality-audit.json
9. README.md

DOMÍNIO E HOSPEDAGEM DE DESENVOLVIMENTO
- O endereço padrão de cada cliente é `https://site.jumper.dev.br/[slug]`; `jumper.dev.br` fica reservado para a Jumper.
- Hospede o build diretamente no Cloudflare Worker `jumper-hoster` com assets estáticos. Não use Vercel como origem ou intermediário.
- Todo site concluído deve ser registrado em `jumper-hoster.registry.json`, aparecer como card no hub `https://site.jumper.dev.br/` e abrir publicamente em `https://site.jumper.dev.br/[slug]/`. Não encerre a entrega se registro, card e rota não estiverem sincronizados.
- A senha protege somente o painel raiz do hub. Não aplique a senha às rotas públicas dos clientes em `/<slug>/`.
- Configure base `/[slug]` e mantenha links e assets internos sob esse prefixo.
- Se houver domínio próprio aprovado para produção, configure-o separadamente.
- Grave a URL completa em `jumper.config.json`, use `SITE_URL=https://site.jumper.dev.br` e `BASE_PATH=/[slug]` no build e valide DNS, HTTPS, card do hub, rota pública, canonical, Open Graph, sitemap, robots, assets e navegação interna.
- Use Vercel somente quando a pessoa solicitar explicitamente; `*.vercel.app` não integra o fluxo padrão.

Artefatos intermediários de planejamento separado não fazem parte do fluxo v3. Se existirem em um cliente legado, use apenas como contexto opcional. Não gere novos.

REGRA CLEAN-ROOM
Cada cliente é um projeto novo. Não copie nem adapte layout, CSS, classes, componentes, hero, menu, cards, grid, footer, animações ou estrutura visual de outro cliente. Infraestrutura técnica pode se repetir; linguagem visual não.

REPERTÓRIO, NÃO MOLDE
Leia os 3 DSs-base da personalidade escolhida em `_referencias-visuais/[personalidade]/design-systems/json/`, os sites bonitos indicados no briefing e referências globais atuais quando necessário. Extraia princípios, nunca pixels: por que aquele hero funciona, como aquele menu cria hierarquia, que ritmo aquela página tem, como a mídia é tratada, onde está o acabamento. Nunca copie layout, texto, imagem, marca ou componente reconhecível. Se você consegue apontar de onde veio uma seção, ela não é sua.

FONTES PERMITIDAS E PROIBIDAS
As restrições específicas do cliente só podem vir do briefing atual, dos materiais do cliente e das decisões registradas no DS inicial ou no DS final deste mesmo cliente. Regras gerais de qualidade só valem quando estiverem nos docs oficiais do sistema. Nunca atribua ao cliente uma regra que não está em nenhuma dessas fontes.

HIERARQUIA DE DECISÃO EM CONFLITO
Quando fontes conflitarem: briefing atual > conteúdo real do cliente > DS final > repertório. Se o briefing pedir algo que prejudica usabilidade ou leitura, não ignore nem obedeça cegamente: registre a tensão no DS final e resolva com elegância — a versão mais refinada possível do que o cliente pediu.

────────────────────────────────────────
PRINCÍPIOS DE OFÍCIO — O QUE "PREMIUM" SIGNIFICA NA PRÁTICA
Estes princípios valem para todos os clientes. Eles não são estilo; são ofício. O estilo vem do briefing e do DS final.

1. TIPOGRAFIA DECIDE A PRIMEIRA IMPRESSÃO
- Escolha fontes por intenção, com justificativa registrada no DS final. Nunca a fonte default, nunca a dupla óbvia que você usaria em qualquer projeto.
- Crie contraste real entre display e texto: escala com saltos perceptíveis, não degraus tímidos. Use clamp() para fluidez entre breakpoints.
- Cuide do que separa amador de profissional: line-height de display apertado (≈1.0–1.15), line-height de leitura generoso (≈1.6–1.75), largura de linha entre 45 e 75 caracteres, letter-spacing negativo em display grande, positivo em labels uppercase, aspas e travessões tipográficos corretos, sem viúvas em headlines importantes.
- Hierarquia deve sobreviver ao teste do squint: apertando os olhos diante da página, os níveis de importância continuam óbvios.

2. RITMO E RESPIRO SÃO COMPOSIÇÃO, NÃO SOBRA
- Defina uma escala de espaçamento e obedeça a ela. Valores mágicos soltos pelo CSS são reprovação.
- Alterne densidade entre seções: seções de impacto respiram muito, seções de informação compactam. Padding idêntico em todas as seções produz papa visual.
- Whitespace é uma decisão de luxo. Segmentos premium pedem mais respiro; segmentos vibrantes pedem energia — mas nunca poluição.

3. COR COM INTENÇÃO, CONTRASTE COM PROVA
- Poucas cores, papéis claros: uma dominante, apoios, superfícies. Cor de destaque gasta em todo lugar não destaca nada.
- Todo par cor-de-texto/fundo usado no site deve ter contraste verificado numericamente (WCAG AA: 4.5:1 texto normal, 3:1 texto grande). Registre os pares e razões no DS final, como fazem os DSs-base. Cor bonita que reprova em contraste vira cor de atmosfera, nunca de texto.
- Crie ritmo claro/escuro ao longo da página quando servir à narrativa — a alternância de superfícies é uma ferramenta de ritmo, não um sorteio.

4. COMPOSIÇÃO AUTORAL
- Fuja do esqueleto único: título centralizado + subtítulo + grid de cards repetido seção após seção é o uniforme do site genérico. Varie estrutura: assimetria, sobreposição controlada, mudança de escala, texto ancorado à esquerda quando a leitura pedir, mídia sangrando a margem quando a personalidade permitir.
- Cada seção precisa de um papel visual distinto, definido no DS final. Se duas seções vizinhas têm a mesma anatomia, redesenhe uma.
- O grid é uma decisão por breakpoint, não uma consequência do framework.

4.1 PRIMEIRA DOBRA DOMINANTE
- Toda página precisa começar com um hero que domina a tela. Em todo viewport, mobile, tablet, desktop e desktop largo, o hero ocupa a tela inteira em pelo menos um eixo: largura total, altura total ou largura e altura.
- Se a largura for o eixo dominante, a composição deve ser full-bleed de verdade, sem parecer bloco estreito perdido na tela. Se a altura for o eixo dominante, use min-height baseado em viewport (`100svh`, `100vh`, `92svh`, etc.) e confira no navegador real.
- A primeira dobra não pode parecer cabeçalho curto, banner tímido, topo de documento ou seção que sobrou antes do conteúdo. Ela é o cartão de visitas e precisa sustentar posicionamento, desejo, confiança e conversão sozinha.

4.2 VAZIO INTENCIONAL, NÃO BURACO
- Todo vazio grande precisa ter função: luxo, foco, ritmo, tensão, descanso visual ou pista da próxima seção.
- Em screenshot, se uma área vazia parecer asset ausente, padding exagerado, grid quebrado, composição incompleta ou trecho abandonado, redesenhe. Não racionalize buraco como minimalismo.
- Vazio precisa ser revisado em todos os tamanhos. Um espaço elegante no desktop pode virar buraco no mobile; um respiro bom no mobile pode virar tela morta no desktop largo.

5. ASSINATURA VISUAL
- Todo site Jumper tem pelo menos um elemento de assinatura: um movimento visual memorável e apropriável pelo cliente — um tratamento tipográfico, uma forma recorrente vinda da marca ou do segmento, um comportamento de hover, um estilo de moldura de mídia, um padrão gráfico próprio.
- Nomeie a assinatura no DS final e aplique-a com consistência em pelo menos três pontos do site. É ela que faz o site parecer desenhado, não montado.

6. ORÇAMENTO DE OUSADIA
- Escolha 2 ou 3 lugares para ser ousado — normalmente o hero, uma seção-chave e uma interação — e seja disciplinado em todo o resto. Ousadia espalhada vira ruído; disciplina total vira tédio. Registre no DS final onde está a ousadia.

7. MOTION COM PROPÓSITO
- Animação existe para guiar leitura, dar resposta e criar percepção de acabamento — nunca para preencher. Durações curtas (≈150–450ms), easing intencional, e nunca o mesmo fade-in-up carimbado em todos os elementos da página.
- Microinterações valem mais que grandes coreografias: hover que responde, foco visível bonito, transições de menu suaves.
- Respeite `prefers-reduced-motion` em tudo.

8. COPY É DESIGN
- Headlines dizem algo que só este cliente poderia dizer. "Bem-vindo ao nosso site", "Qualidade e compromisso", "Soluções personalizadas para você" e parentes são reprovados de ofício.
- CTAs usam verbo + resultado específico ("Agendar avaliação", "Ver o cardápio de hoje"), nunca "Saiba mais" como muleta universal.
- Microcopy existe: placeholder de formulário, mensagem de erro, texto de confirmação, legenda de mídia. Site premium não tem canto sem cuidado.
- Nunca invente telefone, endereço, equipe, preços, depoimentos, números ou certificações. Dado provisório entra marcado como provisório e documentado no README.

PADRÕES PROIBIDOS DE OFÍCIO (ANTI-SLOP)
Reprove na revisão, sem exceção, a menos que o briefing peça explicitamente:
- hero centralizado genérico com gradiente vibrante e blobs decorativos;
- três cards idênticos (ícone em cima, título, parágrafo) como resposta padrão para qualquer conteúdo;
- emoji usado como ícone;
- border-radius e sombra uniformes aplicados em tudo indistintamente;
- a mesma anatomia de seção repetida página inteira;
- imagem de banco clichê: aperto de mãos, call center sorrindo, equipe apontando para laptop;
- footer inchado com colunas vazias;
- glassmorphism, neon ou dark-mode-de-fábrica sem raiz no briefing;
- decoração sem função: divisores, partículas, formas flutuantes que não comunicam nada.
Esta lista é piso, não teto: qualquer padrão que você reconheça como "cara de template de IA" entra nela.

────────────────────────────────────────
FASE 1 — ENTENDER O CLIENTE
Leia:
- `_doc-mestre/LICOES.md` — o loop de aprendizado do sistema (princípios transferíveis de entregas passadas; repertório de ofício, nunca molde);
- `clientes/[slug]/briefing/briefing-normalizado.md`, se existir;
- `clientes/[slug]/data/design-system.json`;
- `clientes/[slug]/data/content.json`;
- `clientes/[slug]/jumper.config.json`;
- os 3 DSs-base da personalidade.

Se `design-system.json`, `content.json` ou `jumper.config.json` ainda não existirem, crie-os antes de continuar:
- `design-system.json` preserva preferências visuais, personalidade A–F, cores/fontes pedidas, sites bonitos, sites a evitar e inferências iniciais;
- `content.json` organiza conteúdo real, sem inventar telefone, endereço, equipe, preços, depoimentos, números ou certificações;
- `jumper.config.json` registra slug, nome, modelo M1/M2/M3/M4 e engine `ds-autoral`.

Depois de criar DS inicial e conteúdo, gere previews simples quando fizer sentido, mas não crie documentos extras de processo.

Antes de qualquer tela, responda por escrito para si mesmo (no raciocínio, não em arquivo):
- O que o cliente vende ou comunica, em uma frase que o próprio dono usaria?
- Quem precisa confiar, desejar ou agir — e o que essa pessoa está sentindo quando chega ao site?
- Qual sensação o site deve causar nos primeiros 5 segundos?
- O que os concorrentes deste segmento fazem igual — e onde está a brecha para este cliente parecer categoricamente melhor?
- Qual tipo de primeira dobra realmente serve a este negócio (mídia imersiva, tipografia dominante, produto em destaque, prova social imediata, ação direta)?
- Qual será a assinatura visual deste site?

Se você não consegue responder a essas perguntas com especificidade, o problema está no entendimento, não no design. Releia o briefing antes de seguir.

FASE 2 — GERAR OU REFAZER O DS FINAL
Crie ou revise `clientes/[slug]/data/final-design-system.json`.

O DS final é a única fonte visual do site. Ele é um documento de decisões, não de possibilidades: cada campo afirma o que o site É, não o que ele poderia ser. Deve conter, no mínimo:
- `client_truth`: o que é inegociável no briefing;
- `visual_thesis`: uma frase de direção visual específica e falsificável — se ela servir para outro cliente do mesmo segmento, está rasa; reescreva;
- `signature_element`: a assinatura visual do site, nomeada, com onde e como ela aparece;
- `repertoire_used`: o que foi aprendido dos DSs-base e referências, princípio por princípio, sem copiar;
- `global_reference_repertoire`: referências globais usadas como repertório, quando houver;
- `anti_generic_decisions`: padrões proibidos para este cliente, somando os proibidos de ofício aos específicos do segmento;
- `tokens`: cores com papéis e razões de contraste verificadas, tipografia com escala fluida (clamp) e pesos por uso, espaçamento em escala nomeada, radius, sombras e motion (durações e easings nomeados);
- `hero_direction`: composição da primeira dobra, mídia, mensagem, CTA, crop, comportamento responsivo e relação com a próxima seção;
- `hero_direction.viewport_coverage`: como o hero ocupa a tela inteira em largura, altura ou ambos em mobile, tablet, desktop e desktop largo;
- `navigation_direction`: menu com desenho próprio, estados, comportamento no scroll, mobile e CTA;
- `media_direction`: assets reais, imagens geradas por IA (com direção de cena, luz, paleta e enquadramento para cada uma), Pexels como segunda opção, vídeos quando fizerem sentido, overlay, fallback e o que não usar;
- `section_system`: papel visual e anatomia de cada seção importante — garantindo variação estrutural entre seções vizinhas;
- `component_language`: botões (todos os estados), cards, formulários, listas, galerias e módulos específicos do segmento;
- `responsive_rules`: mobile, tablet, desktop e desktop largo — incluindo o que muda de composição, não só o que empilha;
- `empty_space_review`: como vazios grandes são usados e quais áreas devem ser inspecionadas para evitar buracos visuais;
- `accessibility_floor`: contraste verificado, foco visível, touch targets ≥ 44px, sem texto cortado;
- `performance_floor`: mídia otimizada, sem animação pesada, sem JS decorativo;
- `quality_gate`: critérios de reprovação visual específicos deste cliente.

Apresente um preview do DS final em `data/design-system-previews/final-design-system-preview.md` e, quando possível, também em HTML, com link/caminho para abrir no navegador.

Gate da fase: se o DS final, lido sozinho, não permite imaginar um site específico e diferente do que você faria para outro cliente, refaça antes de avançar.

FASE 3 — GERAR O PROMPT EXECUTIVO DO SITE
Antes de criar `src/`, gere `clientes/[slug]/data/final-site-build-prompt.md`.

Esse arquivo é a ponte entre o DS final e o código. O teste dele: duas pessoas que o lessem separadamente deveriam imaginar essencialmente o mesmo site.

Use exatamente estes cabeçalhos (o doctor valida a estrutura):
- `# Prompt Final de Construção — [nome do cliente]`
- `## Prompt Visual Executivo` — a descrição vívida do site, dobra a dobra, como se você narrasse a tela para alguém de olhos fechados;
- `## Síntese Profunda do Cliente`
- `## Objetivo Comercial`
- `## Primeira Dobra` — o que o visitante vê, lê e pode fazer, em ordem;
- Dentro de `## Primeira Dobra`, definir explicitamente como o hero ocupa a tela inteira em largura, altura ou ambos em mobile, tablet, desktop e desktop largo;
- `## Menu e Navegação` — desenho, estados, comportamento em scroll e mobile;
- `## Mídia, IA, Pexels e Vídeo` — imagem gerada por IA como primeira opção provisória (com o prompt de geração de cada imagem), uso ou recusa de Pexels como segunda opção, vídeo quando fizer sentido;
- `## Estrutura do Site` — página por página, seção por seção, com o papel de cada uma na jornada de convencimento;
- `## Componentes e Interações` — com estados;
- `## Critérios de Qualidade Premium` — incluindo padrão premium e responsividade;
- `## Checklist de Revisão Visual`
- Dentro do checklist, incluir revisão de espaços vazios: nenhum buraco, faixa morta, asset ausente, padding exagerado ou área sem função em qualquer viewport;
- `## Critério de Pronto`

Gate da fase: se o prompt executivo estiver raso, genérico ou permitir dois sites muito diferentes, refaça antes de codar.

FASE 4 — CONSTRUIR O SITE
Construa o site em Astro dentro de `clientes/[slug]/`.

Regras de direção:
- A primeira dobra concentra posicionamento, desejo, confiança e conversão. A composição é autoral e justificada pelo briefing, nunca escolhida por conveniência de template.
- O hero de cada página ocupa a tela inteira em pelo menos um eixo em todos os viewports: largura total, altura total ou ambos. Essa cobertura deve ser validada em navegador/screenshot, não presumida pelo CSS.
- Navegação, componentes, grids, CTA, mídia, tipografia, estados e mobile têm intenção visual e coerência com o DS final. Nenhum elemento entra "porque sites têm isso".
- Quando faltarem assets reais, prefira imagem gerada por IA sob medida — nascida do briefing, do DS final e do prompt executivo — para cenas específicas, autorais, premium ou difíceis de achar em banco. Pexels é segunda opção: foto ou vídeo de banco só entra se assunto, crop, peso e contexto comunicarem o cliente com precisão. Toda mídia provisória entra como peça finalizável e documentada para troca futura.
- Se uma seção não sustenta a experiência premium, redesenhe composição, hierarquia, ritmo ou função — não a decore.
- O site cabe e respira de 320px a desktop largo, sem scroll horizontal. Responsivo significa recompor, não só empilhar: revise cada seção em cada faixa.

Piso técnico (não negociável) — use os primitivos de `_jumper-sites-system/_infra/` como fonte canônica (copie e preencha com os dados reais do cliente; NUNCA copie visual, só infraestrutura):
- SEO/head: copie `_infra/seo/SeoHead.astro` — cobre title/meta/OG/canonical/favicon e JSON-LD LocalBusiness.
- Motion: cole `_infra/motion/reduced-motion.css` no fim do CSS global.
- Fontes: siga `_infra/fonts/README.md` (self-host, nunca CDN).
- Mídia pesada: rode `_infra/media/optimize-media.mjs <pasta>` para caber no orçamento.
- HTML semântico: header/nav/main/section/footer, um único h1 por página, ordem de headings sem saltos, landmarks corretos, `lang="pt-BR"`.
- Imagens via pipeline do Astro (astro:assets / <Image>): formatos modernos, srcset, dimensões declaradas (zero layout shift), lazy loading abaixo da dobra, mídia do hero com carregamento prioritário.
- Fontes SEMPRE self-hosted (ex.: @fontsource ou woff2 local em public/fonts/), com preload do peso principal e `font-display: swap`; carregue só os pesos que o DS final usa. Fontes de CDN externo (Google Fonts, Typekit etc.) são reprovadas pelo gate: são render-blocking e impedem nota máxima de performance.
- Todo texto alternativo escrito de verdade, descrevendo a imagem no contexto do cliente.
- Estados completos: hover, focus-visible, active, disabled e erro de formulário — desenhados, não herdados do browser.
- SEO base: title e meta description únicos por página, Open Graph com imagem, favicon, e sitemap quando multi-página. Página 404 desenhada quando multi-página.
- JavaScript apenas quando um comportamento exige; nada de biblioteca pesada para efeito decorativo.
- `prefers-reduced-motion` respeitado em toda animação.

Blog/novidades:
Se `content.blog.enabled = true` ou o briefing pedir blog editável, implemente o Blog Autônomo Jumper conforme a seção de blog em `_doc-mestre/DOC-MESTRE.md`, incluindo modo server, adapter Node, rotas, segurança de senha e os 7 passos de validação.

FASE 5 — REVISAR CONTRA PADRÃO PREMIUM
Revisar significa olhar, não relembrar. Rode o build e o preview do cliente. Rode também o teste headless de responsividade: `npm run viewport -- --url <preview> --slug [slug]` (ou `--dist dist/` para clientes estáticos). Ele mede, em 320/390/768/1024/1280/1440/1920, scroll horizontal, dominância do hero (≥90% de um eixo) e alvos de toque <44px, e salva screenshots em `data/visual-review/`. Exit 0 = aprovado; exit 1 = corrija e rode de novo; exit 2 = Playwright ausente, a responsividade fica NÃO VERIFICADA (instale com `npx playwright install chromium` — não trate "não verificado" como aprovado). Examine as capturas geradas seção por seção; se nenhuma ferramenta de browser existir, audite o HTML/CSS do dist/ simulando cada viewport com rigor.

Passe 1 — Impacto e direção:
1. Primeira dobra isolada: teste dos 5 segundos e teste do print.
2. Assinatura visual: presente, reconhecível, consistente?
3. Alinhamento, hierarquia, ritmo entre seções, mídia, menu, CTAs e respiro.
4. Copy inteira relida: corte clichês, aperte headlines, confira microcopy.
5. Espaços vazios: cada vazio grande tem intenção? Alguma área parece buraco, asset ausente, seção incompleta ou padding exagerado?

Passe 2 — Responsividade e acabamento:
6. Cada viewport: hero domina a primeira dobra em largura, altura ou ambos; sem scroll horizontal, sem texto cortado ou sobreposto, sem imagem esmagada, touch targets adequados, menu mobile impecável.
7. Estados: percorra hovers, focos, formulários com erro, links — tudo responde e tudo leva a algum lugar.
8. Performance e acessibilidade: rode `npm run measure -- --url <preview>` (e `--desktop`) — Lighthouse com cortes AAA+ (Performance/A11y/BP/SEO); exit 2 = Chrome/Lighthouse ausente, performance NÃO VERIFICADA (não trate como aprovada). Contraste dos pares realmente usados (rode `npm run contrast -- [slug]` — recalcula cada par do DS com WCAG real e reprova número inventado ou abaixo de AA). Peso de mídia, foco visível, motion reduzido.

Corrija tudo que estiver sem direção visual, desalinhado, cortado, sobreposto, lento, incoerente com o DS ou sem função. Depois repita os dois passes do zero — a segunda revisão encontra o que a primeira normalizou. Se o resultado ainda não atingir padrão premium de especificidade, confiança, desejo, conversão, responsividade e acabamento, revise uma terceira vez.

Regra de honestidade: se você reprovaria essa tela no site de um concorrente, reprove no seu. "Bom o suficiente" não é um veredito disponível.

FASE 6 — AUDITORIA E ENTREGA
Gere `data/visual-quality-audit.json` com avaliação honesta, no formato que o doctor valida:
- `schema_version`: "3.0.0";
- `stage`: "visual_quality_audit";
- `status`: "approved" | "approved_with_fixes" | "blocked";
- `success_tests`: resultado dos testes dos 5 segundos, do print e do concorrente, com justificativa;
- `first_fold`: avaliação da primeira dobra;
- `visual_checks`: tipografia, composição, ritmo, mídia, assinatura visual, anti-slop;
- `functional_checks`: links, formulários, estados, responsividade por viewport, acessibilidade, performance;
- `deep_review_passes`: lista com o que cada passe de revisão encontrou e corrigiu (mínimo 2 passes);
- `known_issues`: obrigatório — o que ficou aquém e por quê; auditoria sem nenhuma ressalva registrada é sinal de auditoria desonesta, não de site perfeito;
- `final_recommendation`: veredito final em texto.

Atualize `README.md` do cliente com: como rodar, como fazer build, o que é mídia provisória e como trocar, dados pendentes do cliente, e instruções do blog quando houver.

Rode validação coerente: build do cliente, doctor e o gate de entrega (`npm run gate -- [slug]` na raiz do repositório, depois do build do cliente). Build e gate precisam terminar verdes. O gate valida leis executáveis — clichês de copy, <img> sem alt/dimensões, vídeo sem poster/playsinline, motion sem prefers-reduced-motion, hero sem altura de viewport, fontes de CDN externo, mídia acima do orçamento, SEO técnico do dist/ (sitemap, robots, meta description única, og:image, favicon, 404), contraste WCAG recalculado, assinatura/wow ancorada no cliente e auditoria sem ressalva substantiva. Gate reprovado = site não pronto; corrija e rode de novo, não contorne.

Feche o loop de aprendizado: acrescente a `_doc-mestre/LICOES.md` os princípios transferíveis desta entrega (armadilhas, padrões aprovados, decisões vencedoras) — nunca pixels ou soluções copiáveis.

Prepare a apresentação: rode `npm run present -- [slug] --url <site publicado>` para gerar `data/presentation/index.html` (reveal com deep-link ao hero e a grade responsiva de screenshots), material da reunião com o cliente.

DEFINIÇÃO DE PRONTO
O site só está pronto quando todas estas afirmações são verdadeiras:
- build verde, doctor passando e gate de entrega aprovado (npm run gate -- [slug]);
- zero scroll horizontal e zero texto cortado ou sobreposto de 320px a desktop largo;
- todos os links, CTAs e formulários funcionam;
- nenhum dado inventado; todo provisório está marcado e documentado;
- contraste AA verificado em todos os pares de texto usados;
- hero ocupa a tela inteira em largura, altura ou ambos em todos os viewports;
- espaços vazios foram revisados e nenhum buraco visual sobreviveu;
- primeira dobra passa no teste dos 5 segundos e no teste do print;
- assinatura visual presente e consistente;
- nenhum padrão da lista anti-slop sobreviveu;
- blog validado nos 7 passos, quando ativo;
- auditoria honesta gerada e README atualizado.

O site só está pronto quando funciona e quando a entrega visual parece digna de apresentação final — não para você, mas para o cliente diante do concorrente.
```
