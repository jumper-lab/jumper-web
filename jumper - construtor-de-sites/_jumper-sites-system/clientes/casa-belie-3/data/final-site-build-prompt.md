# Prompt Final de Construção — Casa Beliê v2

Documento único de direção executiva. Fonte: briefing + `final-design-system.json` + `content.json`. Em conflito, o briefing manda.

## Prompt Visual Executivo

A casa tem um muro de pintura; o site é uma casa editorial calma onde a infância rabiscou por cima. Papel quente (`#FDFAF4`), serifa de livro de história (Fraunces), corpo amistoso (Nunito Sans), bilhetes manuscritos (Caveat, só nas margens) e o **Traço Beliê**: traços de giz SVG que se desenham (stroke-dashoffset) em lavanda, verde e terracota. Álbum de família como linguagem de mídia: polaroids com fita, rotação sutil, legendas manuscritas. Nunca buffet: sem 3 cards idênticos, sem mascote, sem neon, sem emoji, sem gradiente digital. Lavanda é momento de marca, não fundo universal. Ousadia orçada: giz no hero, marcadores de seção, CTA e muro de memórias — disciplina em todo o resto.

## Síntese Profunda do Cliente

Casa de festas infantil de ~800 m² em Laranjeiras/RJ com quintal verde, luz natural, tanque de areia, área molhada e muro de pintura. Fundadoras com trajetória (Isabela/Madame Girafa desde 2014; Cecília/Vila Pindorama). Proposta: celebrações afetivas, minimalistas e **sem telas** — "um belo lugar para viver o que realmente importa". Público: famílias da Zona Sul sensíveis a estética e experiência, não a preço. Não é: buffet genérico, parque indoor, balada infantil. Tom: casual e amistoso, primeira pessoa da casa; manuscritas falam como bilhete de mãe.

## Objetivo Comercial

Gerar conversa no WhatsApp. CTA único e repetido: "Pedir orçamento" → `https://wa.me/5521996694990` (PROVISÓRIO — confirmar número antes de publicar) com mensagem pré-preenchida. Formulário de contato monta a mensagem e abre o WhatsApp. Sem preços públicos. Eventos a instrumentar quando houver IDs: clique WhatsApp, envio de formulário, clique no mapa (GA4 + Meta Pixel + Google Ads).

## Primeira Dobra

Home: `min-height:100svh` (fallback `100vh`), foto real full-bleed do quintal com zoom lento 1.06→1 (2.4s), scrim quente `linear-gradient(to top, rgba(45,36,55,.74), rgba(45,36,55,.16))`. Kicker com estrelinha rabiscada; H1 Fraunces em 2 linhas com revelação linha a linha e sublinhado de giz que se desenha sob "brincar de verdade"; parágrafo síntese ≤52ch; CTA primário com círculo de giz no hover + ghost "Conhecer a casa"; anotação Caveat "o quintal fica bem aqui" com seta desenhada (≥1000px). Em ≤560px o H1 usa `clamp(1.7rem, 8.5vw, 2.9rem)` para a palavra sublinhada nunca cortar. Páginas internas: primeira dobra dominante ≥62svh em superfície alternada com `stroke_word` própria. A primeira dobra responde: o quê, para quem, por que confiar, o que fazer.

## Menu e Navegação

Header fixo, transparente sobre o hero (logo invertida + wordmark "Casa Beliê" em Fraunces brancos), sólido papel com sombra fina após 40px. Links: A casa · Festas · Espaço · Novidades + CTA pill. Hover: sublinhado que cresce da esquerda; `aria-current` na página ativa. Mobile <820px: hambúrguer → painel papel em tela cheia, links Fraunces grandes, CTA no rodapé do painel, Esc fecha, foco gerenciado. Footer verde-mata: tagline, endereço (provisório), WhatsApp, Instagram, mini-nav, linha de SEO local.

## Estrutura do Site

M4 — 6 páginas + blog autônomo:

1. **Home**: hero 100svh → marquee → manifesto → casa/6 ambientes → quatro formatos de evento → muro de memórias → fundadoras → números → avaliações do Google → novidades → CTA final.
2. **Sobre**: história, manifesto do brincar livre (verde-mata), estrutura de 800 m² e CTA visita.
3. **Festas**: Escolar, Infantil, Teen e Adulto/confraternizações; buffet, recreação, decoração, processo em 3 passos e CTA.
4. **Espaço**: quatorze ambientes do briefing, galeria muro de memórias, mapa embed + link Google Maps.
5. **Novidades**: lista de posts published com data manuscrita; empty state desenhado.
6. **Contato**: formulário com nome, telefone, e-mail, tipo de evento e observações → WhatsApp com mensagem montada; caminhos diretos.

Anatomia nunca repete em seções vizinhas; superfícies alternam papel/areia/lavanda-véu/verde-brisa/verde-mata/manteiga.

## Mídia, IA e Pexels

Prioridade: (1) fotos do @casabelie baixadas e tratadas (crop, luz quente) — mídia principal na versão final; (2) Pexels com curadoria aprovada no DS — provisórias atuais: hero 10032939, manifesto 10032949, muro 10037060/17637171/34453927, baixadas localmente com srcset 2 tamanhos e dimensões explícitas; (3) imagem gerada por IA sob medida quando as anteriores não resolverem. **Não usar imagens do site WordPress** (decisão do usuário — genéricas). Vídeo: fora desta versão (nenhum link institucional confirmado). Crianças identificáveis só com autorização por escrito. Alt text escrito de verdade em toda imagem de conteúdo; decorativas com `alt=""` e `aria-hidden`. Lazy em tudo exceto hero (`fetchpriority="high"`).

## Blog Autônomo Jumper

Astro `output:"server"` + `@astrojs/node` (standalone). `/admin/` protegido por `BLOG_ADMIN_PASSWORD` (fallback local `belie-preview-2026` SÓ para preview, documentado no README); senha errada → 401; nada renderiza nem é buscado antes da senha; sem auto-login por localStorage. Rotas: `/blog/`, `/blog/[slug]/`, `/api/blog-posts`, `/api/blog-upload`. Posts em `data/blog-posts.json`; upload em `public/uploads/blog/` (jpg/png/webp/avif/gif, máx 8MB). APIs públicas retornam apenas `published`; draft/archived nunca aparecem no blog público.

## Checklist de Revisão Visual

Padrão premium é o critério: funcionar é piso; a entrega precisa parecer final, intencional e específica da Beliê.

- Responsividade: screenshots/medições em 320, 768, 1024 e 1440+; zero scroll horizontal e zero texto cortado em todos.
- Palavra sublinhada do hero cabe em 320px (medida: 273px < 280px úteis).
- Espaços vazios revisados: whitespace com função (ritmo editorial), nenhum buraco visual.
- Estados de hover/focus percorridos: botões, links, linhas de serviço, polaroids, abas do admin.
- Menu mobile abre/fecha, Esc funciona, foco visível em tudo.
- Contrastes da tabela do DS conferidos numericamente (11 pares AA/AAA; decorativos marcados).
- Blog validado nos 7 passos (sem senha não vaza, 401, senha correta, criar, arquivar some do público, upload, build verde).
- Copy relida contra a lista de proibidos do content.json.

## Critério de Pronto

Build verde + doctor sem erro; os três testes de sucesso registrados em `visual-quality-audit.json` (5 segundos, print, concorrente); assinatura visual presente em 5 pontos; nenhum padrão anti-slop; dados provisórios sinalizados (WhatsApp, endereço, e-mail, horário, extras); `known_issues` honesto preenchido; README do cliente atualizado com operação do blog e pendências para o cliente.
