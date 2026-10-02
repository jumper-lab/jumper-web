# Rodeio Restaurante — revisão de outubro de 2026

## Fonte vigente
As diretrizes e os textos desta revisão vêm de `briefing/entrada/diretrizes-2026-10-02/RODEIO SITE (2).pdf`, lido nas 11 páginas, incluindo os links embutidos. Texto, links e seleção fotográfica estão arquivados na mesma pasta. `data/content.json` centraliza os textos aprovados e os dados das unidades.

## Entrega
- Home: “O clássico que se renova”, apresentação do novo momento e das duas casas, com novos registros do Jardins.
- Slideshow: seis fotos reais do acervo; mantida a ordem anteriormente aprovada (2, 5, 1, 3, 4, 6). Troca suave, carregamento progressivo e alternativa sem movimento.
- Menu: história, cardápio, eventos, reservas e as duas unidades; Home está acessível pela marca e aparece no menu móvel e no rodapé.
- História: sete parágrafos integrais do texto aprovado, juntos e na ordem original, incluindo os clássicos, certificação de 2001, inauguração do Iguatemi em 2011 e mudança do Jardins em 2026. Linha do tempo resumida após a narrativa, sem repetir os parágrafos. Acervo com três fotos adicionais.
- Cardápio: composição fotográfica dos cortes e do serviço do Arroz Rodeio, com nomes dos clássicos em Bodoni Moda, duas novas fotos do Drive e textos exatos da diretriz. Link recebido do LiveMenu em três pontos e convite para reserva. Fotografia do cardápio físico desatualizado permanece removida.
- Jardins: Rua Haddock Lobo, 1448, Jardins. Iguatemi: Av. Brig. Faria Lima, 2232, Jardim Paulistano. Textos e ações por unidade.
- Eventos: um ambiente de cada unidade, sem apresentar fotografia de salão como registro de evento.
- `/em-breve/`: página independente de manutenção com fotografia BMM_35 do novo link, logo branca sem cowboy, endereços, reservas e cardápio. O site completo continua na home da prévia.
- Artes de manutenção: `data/deliverables/em-breve/rodeio-em-breve-2560x1440.jpg` e `rodeio-em-breve-1920x1080.jpg`.
- Fotos proporcionais, com recorte `cover`, sem esticar nem distorcer. Derivados AVIF responsivos; matrizes e documentos não são enviados como conteúdo do site.

## Validação atual
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
A pasta Eventos recebida está vazia: faltam fotografias de eventos representativas de cada unidade. Ainda falta o novo material do cardápio físico. A nova diretriz resolve o número do endereço Jardins (1448); horários e telefone individual do Iguatemi continuam aguardando confirmação comercial e não foram inventados. Os assets de marca com e sem símbolo, escuros e brancos, ficam armazenados em `public/logos/`.

## Operação do site
Reservas usam Tagme por unidade, carregado por interação, com alternativa de link direto. Não foram enviadas reservas ou solicitações de orçamento durante os testes. Conteúdo de terceiros e disponibilidade real são responsabilidade dos serviços externos. Fontes e fotos são locais; mapas são carregados por interação. Arquivos `data/visual-review/` são evidências internas e não entram no pacote publicado.

## Publicação verificada — 02/10/2026
Worker dev versão `10be748f-df69-4e6a-b295-14e62e3a5f28`, fonte `2c91b0b37c703638a27479c0b9a714c72e55c1a4` (menu mobile em tela inteira, PR #87). Os commits finais de evidências não alteram o pacote do site. A publicação oficial continua separada. Registro completo: `data/cloudflare-deployment.json`.

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
