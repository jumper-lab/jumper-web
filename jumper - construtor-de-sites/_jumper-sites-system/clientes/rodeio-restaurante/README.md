# Rodeio Restaurante — revisão de outubro de 2026

## Fonte vigente
As diretrizes e os textos desta revisão vêm de `briefing/entrada/diretrizes-2026-10-02/RODEIO SITE (2).pdf`, lido nas 11 páginas, incluindo os links embutidos. A apresentação Google Slides foi relida integralmente em 07/10/2026 e coincide com a narrativa aprovada. O acervo atualizado, sua seleção e a leitura dos 11 slides estão registrados em `briefing/entrada/acervo-atualizado-2026-10-07/`. `data/content.json` centraliza os textos aprovados e os dados das unidades.

## Entrega
- Home: “O clássico que se renova”, apresentação do novo momento e das duas casas, com novos registros do Jardins.
- Slideshow: seis fotos reais do acervo; mantida a ordem anteriormente aprovada (2, 5, 1, 3, 4, 6). Troca suave, carregamento progressivo e alternativa sem movimento.
- Menu: história, cardápio, eventos, reservas e as duas unidades; Home está acessível pela marca e aparece no menu móvel e no rodapé.
- História: sete parágrafos integrais do texto aprovado, juntos e na ordem original, incluindo os clássicos, certificação de 2001, inauguração do Iguatemi em 2011 e mudança do Jardins em 2026. Linha do tempo resumida após a narrativa, sem repetir os parágrafos. Acervo com três fotos adicionais.
- Cardápio: corte com batata e sobremesa do ensaio de setembro de 2026, fotografias completas na proporção nativa; nomes dos clássicos em Bodoni Moda e textos exatos da diretriz. Link recebido do LiveMenu em três pontos e convite para reserva. Fotografia do cardápio físico desatualizado permanece removida.
- Jardins: Rua Haddock Lobo, 1448, Jardins. Iguatemi: Av. Brig. Faria Lima, 2232, Jardim Paulistano. Textos e ações por unidade.
- Eventos: registro de evento do Iguatemi recebido em 07/10/2026; hero dos Jardins identificado como ambiente, sem inventar registro de evento dessa unidade.
- `/em-breve/`: página independente de manutenção com fotografia BMM_35 do novo link, logo branca sem cowboy, endereços, reservas e cardápio. O site completo continua na home da prévia.
- Artes de manutenção: `data/deliverables/em-breve/rodeio-em-breve-2560x1440.jpg` e `rodeio-em-breve-1920x1080.jpg`.
- Fotos proporcionais: pratos e registro de evento completos, com `contain`; recortes responsivos somente nos heros e nas miniaturas das galerias, sem esticar nem distorcer. Derivados AVIF responsivos; matrizes e documentos não são enviados como conteúdo do site.

## Validação da revisão de 02/10/2026 (histórico)
`npm run check`: 29 arquivos, zero erros, avisos e hints. Build: 11 páginas.
`scripts/verify-current-briefing.mjs`: 126 verificações de páginas e interações em Chrome, Firefox e WebKit; zero falhas, imagens quebradas, overflow ou títulos cortados. Chrome em 320, 390, 768, 1024, 1440 e 1920 px; Firefox/WebKit em 390 e 1440 px. Menu, seleção de unidade e lightbox verificados. Contraste auditado com axe em desktop e celular. Cabeçalho também conferido em 1199, 1200, 1280 e 1366 px.

Lighthouse de laboratório local após otimização: home mobile 95, desktop 100; acessibilidade e boas práticas 100. Relatórios brutos e amostras anteriores preservados em `data/visual-review/diretrizes-2026-10-02/`. Medição da versão publicada: desempenho 93–100 nas nove páginas mobile e na home desktop; acessibilidade e boas práticas 100 em todas as dez amostras. SEO 69 pelo noindex intencional da prévia. Resultados em `performance-published/summary.json`; as amostras anteriores foram preservadas. Não são dados de campo/CrUX nem uma execução da API PageSpeed Insights. A prévia mantém noindex; SEO não deve ser anunciado como verde.

Os 21 testes do Worker dev/preflight passaram. O preflight antes e depois do deploy comparou 432 assets dos demais clientes: zero diferenças; hub, briefing, APIs e oficiais preservados. Dez rotas públicas retornaram 200 e HTML idêntico ao build.

## Publicação
Prévia pública: https://site.jumper.dev.br/rodeio/ . Worker: `jumper-hoster-dev`. Hub, briefing e oficiais permanecem no Worker live. A publicação desta revisão é exclusivamente da prévia da Rodeio.

Seguir `../../AGENTS.md` e `../../JUMPER-HOSTER.md`: branch isolada → build/testes → PR → deploy dev → revisão → merge. GitHub não dispara deploy automaticamente. Não executar Wrangler diretamente.

```sh
npm run check
npm run build:cloudflare
npm run inventory:dev -- --allow=rodeio
npm run verify:dev-config
npm run test:dev-worker
npm run test:dev-preflight
# Após publicar a branch limpa e abrir a PR:
npm run preflight:dev -- --allow=rodeio
npm run deploy:dev -- --allow=rodeio
```

O inventário só deve ser atualizado para Rodeio; qualquer diferença em outro site bloqueia a publicação. A prévia tem noindex e os links dos clientes são públicos. Não publicar no domínio oficial por inferência.

## Materiais ainda pendentes
Recebida a foto de evento do Iguatemi; ainda falta um registro identificado de evento dos Jardins. Ainda falta o novo material do cardápio físico. A nova diretriz resolve o número do endereço Jardins (1448); horários e telefone individual do Iguatemi continuam aguardando confirmação comercial e não foram inventados. Os assets de marca com e sem símbolo, escuros e brancos, ficam armazenados em `public/logos/`.

## Operação do site
Reservas usam Tagme por unidade, carregado por interação, com alternativa de link direto. Não foram enviadas reservas ou solicitações de orçamento durante os testes. Conteúdo de terceiros e disponibilidade real são responsabilidade dos serviços externos. Fontes e fotos são locais; mapas são carregados por interação. Arquivos `data/visual-review/` são evidências internas e não entram no pacote publicado.

## Publicação verificada — 02/10/2026
Worker dev versão `36889bbd-07fb-4d46-95e8-d597b0fe118e`, fonte `b7afa043cab9355547af8f0c4d58c3b931d5550f` (galeria Jardins, PR #90). Os commits finais de evidências não alteram o pacote do site. A publicação oficial continua separada. Registro completo: `data/cloudflare-deployment.json`.

## Correção editorial da História — 02/10/2026
O texto estava fragmentado entre a cronologia e a seção dos clássicos. Agora os sete parágrafos aparecem integralmente antes do acervo, sob “Uma história que atravessa gerações.”. `pages.history.paragraphs` e `positioning.story` guardam a mesma narrativa completa. O trecho dos clássicos ocupa o terceiro parágrafo, conforme a aprovação no chat. Datas permanecem como referência compacta, sem repetir a narrativa.

Verificação específica: `node scripts/verify-history-integral.mjs` compara o texto renderizado com o conteúdo aprovado (fingerprint SHA-256), exige sete parágrafos na ordem correta e confere a narrativa antes do acervo. Também verifica imagens, reflow, erros JavaScript, título visível após animação e acessibilidade, em Chrome, Firefox e WebKit. Evidências em `data/visual-review/historia-integral/`.

A correção foi validada em dez cenários locais e dez públicos (Chrome, Firefox, WebKit): sete parágrafos exatos e ordenados, título visível, imagens carregadas, sem overflow, erros JavaScript ou violações axe nos cenários auditados. Dez rotas públicas retornaram 200 sem cookies e HTML idêntico ao build. Preflight antes/depois preservou 432 assets dos outros clientes e áreas live. Lighthouse da História publicada: desempenho 97 mobile / 100 desktop; acessibilidade e boas práticas 100; SEO 69 pelo noindex intencional da prévia. Relatórios brutos em `data/visual-review/historia-integral/performance-published/`; métricas de laboratório, não API PageSpeed Insights nem CrUX.

## Cardápio: clássicos em destaque — 02/10/2026
A página foi refeita conforme a referência da seção 3 do PDF: “Os clássicos do Rodeio”, “Uma seleção de sabores que atravessa gerações.”, a descrição aprovada e “Confira o cardápio”. Duas fotos do Drive ainda inéditas no site: `rodeio (16) (1).jpg` (cortes e acompanhamentos, sem identificar o corte da foto como picanha) e `3M7A6213.jpg` (serviço do Arroz Rodeio). Proveniência em `briefing/entrada/cardapio-classicos-2026-10-02/fotos-selecionadas.json`. Nomes da picanha fatiada e do Arroz Rodeio são destacados em texto. Imagens AVIF responsivas, lazy loading e recorte proporcional; maior variante nova: 308.018 bytes.

A composição tem margens comuns, legendas alinhadas em desktop, sequência vertical no celular e encerramento dedicado ao cardápio completo e às reservas. Mantém cores, fontes locais e animações do site. Verificação específica: `scripts/verify-cardapio-classicos.mjs`; evidências em `data/visual-review/cardapio-classicos/`.

Cardápio final: dez cenários locais e seis públicos em Chrome, Firefox e WebKit, sem falhas de copy, link, imagem, alinhamento das fotos, reflow ou axe nos cenários auditados. Cardápio digital responde HTTP 200. Preflight antes/depois preservou os 432 assets dos outros clientes e áreas live. Dez rotas Rodeio públicas retornaram 200 e HTML idêntico ao build. Lighthouse do Cardápio publicado: desempenho 94 mobile / 99 desktop; acessibilidade e boas práticas 100; CLS e TBT zero. SEO 69 pelo noindex intencional da prévia. Relatórios brutos em `data/visual-review/cardapio-classicos/performance-published/`; métricas de laboratório, não API PSI nem CrUX.

## Slideshow: swipe na home — 02/10/2026
A hero da home aceita arrastar para esquerda (avançar) e direita (voltar), com retorno circular entre as seis fotos. Pointer Events passivos e `touch-action: pan-y pinch-zoom` preservam rolagem vertical e zoom; links e indicadores continuam com seus toques normais. Gestos curtos, predominantemente verticais, cancelados e multitouch não navegam. A troca automática pausa durante contato e reinicia ao finalizar. Preferência por movimento reduzido mantém navegação manual, sem autoplay.

A foto atual permanece até a próxima imagem estar decodificada. Pedidos rápidos mantêm a última intenção, sem mostrar uma resposta antiga de download ou quadro vazio. Carregamento progressivo preservado: não há pré-carregamento inicial das seis fotos nem biblioteca nova.

Validação: `scripts/verify-home-swipe.mjs`, 30 verificações. Chrome com toque nativo CDP, incluindo rolagem real; Firefox/WebKit com PointerEvents simulados (não substituem testes em aparelhos físicos). Direções, retorno circular, limites de gesto, cancelamento, multitouch, caneta, mouse, botões, teclado, conexão lenta/falha de imagem e autoplay conferidos. Evidências em `data/visual-review/home-swipe/`.

Versão publicada: as mesmas 30 verificações de swipe passaram no endereço público; dez páginas retornaram HTTP 200 sem cookies, com HTML idêntico ao build. Preflight antes e depois preservou os 432 assets dos outros clientes e as fronteiras live. Lighthouse da home publicada: desempenho 94 mobile / 100 desktop; acessibilidade e boas práticas 100; CLS e TBT zero. SEO 69 devido ao noindex intencional da prévia. Medição de laboratório, não API PageSpeed Insights nem CrUX. Relatórios brutos em `data/visual-review/home-swipe/performance-published/`.

## Home: fotos dos pratos clássicos — 02/10/2026
A seção 02 substitui o corte com osso e a sobremesa por Picanha fatiada e Arroz Rodeio (Biro-Biro), nomes citados na página 6 do PDF aprovado. As fotos são do cardápio digital indicado pelo cliente, com identidade confirmada pelos respectivos itens. Proveniência em `briefing/entrada/home-pratos-classicos-2026-10-02/fotos-selecionadas.json`. São inéditas nas páginas do site, com legendas e alt específicos. Derivados AVIF em 320 e 480 px, lazy loading e dimensões reservadas; originais quadrados de 522 px, sem ampliar pixels na geração dos arquivos. A matriz em maior resolução pode substituir estes arquivos quando disponível. A hero, a ordem das seis fotos e o swipe permanecem iguais.

Verificação local: nove cenários de layout em Chrome, Firefox e WebKit, de 320 a 1920 px. Fotos carregadas, nomes, links, reflow e alinhamento conferidos; axe sem violações nos cenários mobile/desktop auditados. Maior variante nova: 45.289 bytes. Astro check sem diagnósticos, build completo e 21 testes Worker/preflight aprovados.

Publicado: nove cenários em Chrome, Firefox e WebKit aprovados também no endereço público, com duas fotos AVIF carregadas, nomes corretos, layout sem overflow e axe sem violações nos cenários auditados. Dez rotas HTTP 200 sem cookies e idênticas ao build. Preflight antes/depois preservou os 432 assets dos demais clientes e as fronteiras live. Lighthouse da home publicada: desempenho 95 mobile / 100 desktop, acessibilidade e boas práticas 100, TBT e CLS zero. SEO 69 devido ao noindex da prévia. Métricas de laboratório, não API PageSpeed Insights nem CrUX; relatórios brutos em `data/visual-review/home-pratos-classicos/performance-published/`.

## Menu mobile em tela inteira — 02/10/2026
O menu compartilhado ocupa toda a largura da área web até 1199 px, sem o limite anterior de 580 px. Altura dinâmica de 100dvh, com fallback 100vh, acompanha mudanças no viewport. O painel permanece fixo nas quatro bordas durante a entrada por opacidade, sem deslocamento vertical. Padding respeita safe areas quando fornecidas pelo navegador; não cobre controles do Safari ou do sistema operacional. Telas baixas mantêm rolagem interna e botão Fechar fixo no topo. Sem nova biblioteca ou alteração nas heros.

Verificação reproduzível: `scripts/verify-menu-mobile-viewport.mjs`; Chrome, Firefox e WebKit em 27 cenários, larguras 320–1199 px, retrato/horizontal, home e páginas internas. Confere área ocupada inclusive durante animação, mudanças de altura com menu aberto, ausência de overflow horizontal, foco/Tab/Escape, links e fechamento. Chrome usa toque nativo CDP para conferir rolagem interna sem rolar o fundo. Axe sem violações nos menus auditados em 390 px. São testes de motores em viewports emulados; não equivalem a Safari em aparelho físico. Astro check sem diagnósticos; build completo e 21 testes Worker/preflight aprovados. Evidências em `data/visual-review/menu-mobile-viewport/`.

Publicado: os mesmos 27 cenários passaram no endereço público. Dez páginas retornaram HTTP 200 sem cookies, com HTML idêntico ao build. Preflight conferiu os 432 assets dos demais clientes; áreas live preservadas após upload. Versão dev `10be748f-df69-4e6a-b295-14e62e3a5f28`, fonte `2c91b0b37c703638a27479c0b9a714c72e55c1a4`, PR #87. Lighthouse da home publicada: desempenho 95 mobile / 100 desktop, acessibilidade e boas práticas 100, CLS zero e TBT 14 ms mobile / zero desktop. SEO 69 devido ao noindex da prévia. Medição de laboratório, não API PageSpeed Insights nem CrUX. Relatórios brutos em `data/visual-review/menu-mobile-viewport/performance-published/`.

## Cardápio em lightbox — 02/10/2026
Todos os links para o LiveMenu indicado pelo cliente abrem o cardápio dentro de um dialog do próprio site: quase a tela inteira em mobile (margem de 8 px) e painel central limitado a 1040 × 800 px no desktop, com fundo escurecido. Cabeçalho e botão Fechar ficam fora da área rolável do iframe. A URL do site e a posição de rolagem são preservadas; fechar remove o iframe e devolve foco ao botão original. As páginas Cardápio, Jardins, Iguatemi e Em breve compartilham o componente.

O iframe é criado somente após clique, sem requisições LiveMenu no carregamento inicial. Links continuam funcionais sem JavaScript e em cliques modificados; o diálogo mantém alternativa Abrir em outra aba. Carregamento lento recebe mensagem após 15 s. Conteúdo, preços, imagens e navegação interna continuam geridos pelo LiveMenu, sem cópia para o site. Fechar permanece acessível fora do conteúdo externo; Escape funciona quando o foco está na página Rodeio, pois eventos do iframe externo não atravessam a origem.

Verificação reproduzível: `scripts/verify-menu-lightbox.mjs`. Integração real com LiveMenu em 21 cenários Chrome/Firefox/WebKit, retrato/horizontal, 320–1440 px, todos os três botões do Cardápio, duas unidades e página Em breve. Inclui categorias, dimensões, mudança de altura com modal aberto, fechamento/foco, Escape no host, clique no backdrop em desktop, remoção do iframe, ausência de requisições externas antes do clique e links sem JavaScript. Axe audita o painel do site; conteúdo externo não faz parte dessa auditoria. Viewports emulados, sem teste físico de aparelho. Astro check sem diagnósticos, build completo e 21 testes Worker/preflight aprovados. Evidências em `data/visual-review/menu-lightbox/`.

A validação com alteração de altura do viewport detectou deslocamento do fundo ao fechar; o componente agora salva as coordenadas da página antes de abrir e as restaura explicitamente ao fechar, além de restaurar foco sem rolar. Os 21 cenários locais passaram com conferência da posição de rolagem, incluindo resize nos três motores.

Publicado: os mesmos 21 cenários passaram no endereço público, incluindo restauração de rolagem após mudança de altura. Menu mobile preservado nos três motores também na versão pública. Dez páginas HTTP 200 sem cookies e idênticas ao build. Preflight antes e depois confirmou os 432 assets dos demais clientes e áreas live preservadas. Versão dev `04dfb8f2-71e0-4644-959f-716cb61f10fd`, fonte `ccaa5590b49513e5bf17cefade81f3a622ed2c99`, PR #88.

Lighthouse publicado: desempenho da home 93 mobile / 100 desktop; Cardápio 94 mobile; acessibilidade e boas práticas 100 nas três medições. TBT zero; CLS da home mobile 0,000769, zero nas outras medições. SEO 69 pelo noindex da prévia. Medição de laboratório, não API PageSpeed Insights nem CrUX. Relatórios brutos em `data/visual-review/menu-lightbox/performance-published/`. O cardápio externo não é carregado durante essas medições iniciais; seu conteúdo e desempenho após abrir são responsabilidade da aplicação LiveMenu.

## Jardins: galeria do novo acervo — 02/10/2026
A galeria dos Jardins passa de 16 para 77 fotografias da pasta indicada pelo cliente, BMM_12 a BMM_88, sem repetir arquivos. A abertura reúne fachada, salão, lounge, bar, mesa posta e a casa em movimento; o restante do acervo segue em ordem numérica. A aplicação foi limitada à galeria, conforme a escolha do cliente. Home, heros, textos e galeria do Iguatemi preservados.

Todas as prévias foram revisadas. Os 77 JPEGs originais totalizam 1.214.053.344 bytes e têm SHA-256 distintos. Foram produzidas 75 matrizes WebP, com maior lado de 2400 px e qualidade 95, sem ampliar, esticar ou distorcer; BMM_35 e BMM_88 reutilizam as matrizes existentes. Os originais em JPEG não entram no pacote público. Proveniência, dimensões e ordem em `briefing/entrada/jardins-novo-acervo-2026-10-02/`.

A página mostra 12 fotos por vez, com botão Ver mais fotografias, AVIF responsivo, dimensões reservadas e lazy loading; o lightbox já permite percorrer as 77 fotografias desde a primeira abertura. Sem JavaScript, as 77 imagens são exibidas e os links abrem os arquivos diretamente. Os 616 derivados da galeria totalizam 43.008.063 bytes armazenados, não transferidos no carregamento inicial. Maior variante responsiva: 309.690 bytes. As legendas descrevem ambientes e serviço; fotos com pessoas não foram classificadas como eventos sem confirmação.

Validação local: `scripts/verify-jardins-gallery.mjs`, 12 cenários em Chrome, Firefox e WebKit, 320–1440 px. Confere 77 arquivos únicos, lazy loading, ausência de overflow, ampliação, setas, teclado, retorno circular, fechamento, foco, exibição progressiva e todas as fotos sem JavaScript. Carregamento inicial de 0–3 fotos da galeria, conforme motor e viewport. Axe sem violações nos cenários Chrome mobile/desktop auditados. Iguatemi permanece com cinco fotos. Viewports emulados, sem teste em aparelho físico. Astro check sem diagnósticos, build Cloudflare e 21 testes Worker/preflight aprovados. HTML de home, História, Cardápio e Eventos idêntico ao build anterior. Conteúdo e assets do Iguatemi preservados; o componente importado acrescenta 1240 bytes de CSS isolado, sem corresponder a elementos dessa unidade. Relatórios em `data/visual-review/jardins-novo-acervo/`.

A primeira medição local da galeria completa rendeu desempenho 80 no mobile, com TBT de 393 ms. A galeria recebeu exibição progressiva para reduzir o trabalho inicial; a medição original foi preservada em `performance-before-progressive/`, sem esconder o resultado.
Após a exibição progressiva, a medição local mobile teve desempenho 92, acessibilidade 100 e boas práticas 100; TBT e CLS zero. SEO 66 pelo noindex intencional da prévia. Métricas de laboratório Lighthouse, não API PageSpeed Insights nem CrUX. O teste final inclui o botão nativo Ver mais em Chrome mobile e confirma as 77 fotografias visíveis sem JavaScript.

Publicado: os 12 cenários da galeria progressiva passaram em Chrome, Firefox e WebKit no endereço público, incluindo fallback sem JavaScript. Todos os 616 AVIFs públicos são idênticos ao build; dez rotas Rodeio retornam HTTP 200 sem cookies e com noindex. Preflight antes/depois conferiu os 564 assets dos outros sete sites e preservou as áreas live. A branch incorporou o main atualizado com o Pão de Queijo antes do upload; 22 testes Worker/preflight passaram. Versão dev `36889bbd-07fb-4d46-95e8-d597b0fe118e`, fonte `b7afa043cab9355547af8f0c4d58c3b931d5550f`, PR #90.
Lighthouse publicado: Jardins com desempenho 95 mobile / 99 desktop; home 95 mobile / 100 desktop. Acessibilidade e boas práticas 100 nas quatro medições. CLS zero; TBT de 67 ms no Jardins mobile e zero nas demais medições. SEO 69 pelo noindex intencional da prévia. Métricas de laboratório, não API PageSpeed Insights nem CrUX. Relatórios brutos em `data/visual-review/jardins-novo-acervo/performance-published/`.


## Clássicos: resolução e enquadramento — 02/10/2026
As duas imagens quadradas de 522 × 522 px do LiveMenu eram ampliadas para o desktop e recortadas por quadros horizontais. Foram substituídas por fotografias autênticas do acervo indicado no documento LINK ULTIMAS FOTOS ABRIL 2024, após revisão das 212 miniaturas e dos nove originais da pasta Cardápio. Não foi necessário usar IA.

Picanha: Captura sem título1313.jpg, original 6240 × 4160 px, preservado inteiro. Arroz Rodeio: IMG_9573.jpg, original 5464 × 8192 px, recorte quadrado que preserva a porção de arroz e o corpo da frigideira, removendo o espaço acima e a base do suporte abaixo. Matrizes 2400 px, WebP qualidade 94, sem ampliar ou deformar. Procedência, dimensões, SHA-256 e recorte em briefing/entrada/home-classicos-qualidade-2026-10-02/fotos-selecionadas.json. Imagens distintas das heros e da fotografia de serviço de arroz da página Cardápio. As matrizes anteriores permanecem armazenadas.

Os cards seguem as proporções nativas 3:2 e 1:1, sem object-fit:cover ou altura fixa. Colunas 1.5:1 alinham fotografias e legendas no desktop; no mobile cada fotografia mantém sua proporção. Quinze derivados AVIF qualidade 68, 320–1920 px na picanha e 320–1600 px no arroz, lazy loading e tamanhos responsivos para DPR2. Maior variante 234.964 bytes; as matrizes WebP privadas não entram no build público. Demais imagens mantêm os valores anteriores do componente Photo. Sem mudanças no slideshow, heros, animações, texto editorial, menu ou galerias.

Verificação: scripts/verify-home-classics-quality.mjs, nove cenários em Chrome, Firefox e WebKit, 320–1920 px com DPR2. Confere resolução real dos AVIF, proporção preservada, alinhamento, legendas, links, lazy loading e ausência de overflow. Axe sem violações nos cenários Chrome mobile/desktop auditados. Viewports emulados, sem teste em aparelho físico. Astro check sem diagnósticos, build completo e 22 testes Worker/preflight aprovados. Evidências em data/visual-review/classicos-fotos-qualidade/.

Lighthouse local da home: desempenho 92 mobile / 100 desktop, acessibilidade e boas práticas 100, TBT e CLS zero. SEO 66 pelo noindex intencional da prévia. Métricas de laboratório, não API PageSpeed Insights nem CrUX.

Publicado: os mesmos nove cenários passaram no endereço público, com AVIF adequado para DPR2 e sem recortes adicionais do CSS. Os quinze AVIFs públicos são idênticos ao build. Dez rotas Rodeio continuam HTTP 200 sem cookies e noindex. Preflight conferiu os 564 assets dos outros sete sites e preservou as áreas live após upload. Versão dev dab45303-d5d8-4fe2-a27e-2f9cc8d8c107, fonte 2b5990cee3b673a814cb640660c65289f296336d, PR #91.
Lighthouse publicado da home: desempenho 95 mobile / 100 desktop, acessibilidade e boas práticas 100. TBT e CLS zero. SEO 69 pelo noindex intencional da prévia. Métricas de laboratório, não API PageSpeed Insights nem CrUX. Relatórios brutos em data/visual-review/classicos-fotos-qualidade/performance-published/.

## Atualização de acervo — 07/10/2026

73 entradas revisadas, 71 fotos únicas. Aplicadas cinco fotos de pratos, dezesseis fotos do Iguatemi e um evento dessa unidade. Os 16 arquivos dos Jardins coincidem por SHA-256 com as fotos já disponíveis na galeria de 77 imagens; reutilizados sem duplicar matrizes. Heros e diretórios mostram os ambientes atuais, e o slideshow preserva a sequência de seis temas, agora com o novo registro do salão do Iguatemi.

Os clássicos da home usam retratos completos da picanha fatiada e do Arroz Rodeio, em duas colunas iguais no desktop e uma coluna no celular. Cardápio mantém os nomes dos clássicos e mostra somente dois destaques em proporção nativa. O LiveMenu continua em popup, sem sair do site. As animações e o swipe foram preservados.

Originais não foram ampliados ou deformados. Matrizes WebP qualidade 94 e derivados AVIF responsivos, lazy fora dos heros; ampliações da nova galeria do Iguatemi em AVIF qualidade 68 até 2400 px, carregadas ao abrir. Não foi necessário usar IA.

A galeria do Iguatemi é progressiva (6 → 12 → 16), com todas as fotografias disponíveis no lightbox desde a primeira abertura e fallback completo sem JavaScript. As variantes mobile dos heros Cardápio/Iguatemi usam AVIF qualidade 55, mantendo dimensão responsiva e qualidade desktop. A primeira medição local ficou em 89 no Cardápio e 88 no Iguatemi; preservada em data/qa/acervo-atualizado-2026-10-07/before-progressive/.

Validação final local de 07/10: Astro check de 34 arquivos sem diagnósticos; build completo; 22 testes Worker/preflight. Cenários em Chrome, Firefox e WebKit para imagens em DPR2, proporções e alinhamento, todas as 16 ampliações, galerias progressivas, swipe, LiveMenu real em 21 cenários e animação única ao subir/descer (duas entradas repetidas em cada navegador). Auditorias axe sem violações nas amostras auditadas.

Lighthouse local final: desempenho home 92 mobile / 100 desktop; Cardápio 91, Iguatemi 91, Jardins 94, Eventos 99, Reservas 93 no mobile. Acessibilidade e boas práticas 100; CLS zero. SEO 66 pelo noindex intencional da prévia. São métricas de laboratório Lighthouse, não API PageSpeed Insights ou dados de campo. Relatórios em data/qa/acervo-atualizado-2026-10-07/local-batched/. Leituras iniciais e intermediárias preservadas. A inicialização das imagens agora lê todas as posições antes de alterar os transforms, reduzindo recálculos sem mudar a animação.

Publicação de 07/10 verificada: https://site.jumper.dev.br/rodeio/ . Worker jumper-hoster-dev versão 3e7e0ba5-a22e-4a5b-a010-1ba5fa69e33c; fonte e3a8b06289f4659aad08b5ea55dfd84956c5d767, PR #92. Dez páginas públicas HTTP 200 sem cookies, conteúdo igual ao pacote após contabilizar apenas o beacon de Analytics acrescentado pela Cloudflare; 222 novos AVIF/JS/CSS idênticos byte a byte. Pré/postflight: 564 assets dos outros sete sites iguais; áreas live preservadas. Nenhuma alteração de Analytics ou autenticação.

Lighthouse publicado: home 97 mobile / 100 desktop; Cardápio, Iguatemi, Jardins, Eventos e Reservas 98 mobile. Acessibilidade e boas práticas 100; CLS zero. SEO 69 pelo noindex da prévia. Relatórios reais de laboratório, não API PageSpeed Insights ou CrUX. Os seis cenários públicos da nova galeria passaram em Chrome, Firefox e WebKit, incluindo todas as 16 ampliações, botão progressivo e fallback sem JavaScript. Evidências em data/qa/acervo-atualizado-2026-10-07/published/ e data/visual-review/acervo-atualizado-2026-10-07/published/.

## Correção de identificação dos clássicos — 07/10/2026
A página Cardápio associa agora cada nome à própria fotografia: Picanha fatiada (acervo 2024, Captura sem título1313.jpg) e Arroz Rodeio/Biro-Biro (3M7A6213.jpg). As duas são fotografias reais do cliente, diferentes das usadas na home, preservadas sem recorte ou deformação e entregues em AVIF responsivo com carregamento lazy. A faixa de nomes separada e a sobremesa foram retiradas dessa seção. As matrizes anteriores permanecem armazenadas. Hero e cardápio digital não foram alterados.

Correção publicada exclusivamente no `jumper-hoster-dev`, versão `479a4a69-0d52-4406-bdc5-90ec4be4ae4c`, fonte `80d3077d`, PR #93. Dez cenários locais e seis públicos em Chrome, Firefox e WebKit aprovados. Dez páginas HTTP 200 sem cookies e 16 novos AVIF idênticos ao pacote. Preflight antes/depois preservou os 564 assets dos outros sete sites e as fronteiras live. Lighthouse da página Cardápio publicada: desempenho **94 mobile / 100 desktop**, acessibilidade e boas práticas **100**, CLS **0**; SEO **69** pelo noindex da prévia. Métricas de laboratório, não API PageSpeed Insights ou CrUX. Evidências em `data/qa/cardapio-identificacao-2026-10-07/published/` e `data/visual-review/cardapio-classicos/identificacao-publicada/`.

## Botão do cardápio completo — 07/10/2026
O acesso ao cardápio na introdução dos clássicos agora usa o botão terracota preenchido, e os três acessos da página exibem “Conferir cardápio completo”. O menu digital continua abrindo no popup existente.

Destaque publicado no `jumper-hoster-dev`, versão `7abd0a7a-2419-4e45-8fc1-6fc7eb927c72`, fonte `a0532cec`, PR #94. Botão e popup conferidos na versão pública em 320, 390 e 1440px; dez páginas HTTP 200 sem cookies e idênticas ao build. Preflight antes/depois preservou os 564 assets dos outros sete sites. Lighthouse Cardápio publicado: desempenho **95 mobile / 100 desktop**, acessibilidade e boas práticas **100**, CLS **0**; SEO **69** pelo noindex intencional. Evidências em `data/visual-review/cardapio-cta/published/` e `data/qa/cardapio-cta-2026-10-07/published/`.

## Hero Cardápio: foco na comida — 07/10/2026
A mesma fotografia 354 recebe um recorte horizontal que prioriza a carne e as folhas, em lugar da borda vazia do prato. Derivados desktop usam `entropy`, e telas horizontais alinham a imagem em 50% 85%. Mobile/tablet conservam os enquadramentos anteriores. Overlay, textos e animação permanecem iguais; a foto não foi esticada ou deformada.

Enquadramento publicado no `jumper-hoster-dev`, versão `98f79e7d-b98e-4ffa-a484-fd7c7e22e3b4`, fonte `53b6e1b4`, PR #95. Nove cenários locais em Chrome/Firefox/WebKit e conferência pública em 390/1822px aprovados. Dez páginas HTTP 200 sem cookies e quatro novos AVIF idênticos ao build; 564 assets dos outros sete sites preservados pelo preflight antes/depois. Lighthouse Cardápio publicado: desempenho **95 mobile / 100 desktop**, acessibilidade e boas práticas **100**, CLS **0**; SEO **69** pelo noindex intencional. Evidências em `data/visual-review/cardapio-hero-foco/` e `data/qa/cardapio-hero-foco-2026-10-07/published/`.
