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
Worker dev versão `53b67b6c-baa9-4d97-be97-a930a4251809`, fonte `27360cba7a89dfa2a947a11a5c6a18a7aedb7b7f` (correção da História integral, PR #83). Os commits finais de evidências não alteram o pacote do site. A publicação oficial continua separada. Registro completo: `data/cloudflare-deployment.json`.

## Correção editorial da História — 02/10/2026
O texto estava fragmentado entre a cronologia e a seção dos clássicos. Agora os sete parágrafos aparecem integralmente antes do acervo, sob “Uma história que atravessa gerações.”. `pages.history.paragraphs` e `positioning.story` guardam a mesma narrativa completa. O trecho dos clássicos ocupa o terceiro parágrafo, conforme a aprovação no chat. Datas permanecem como referência compacta, sem repetir a narrativa.

Verificação específica: `node scripts/verify-history-integral.mjs` compara o texto renderizado com o conteúdo aprovado (fingerprint SHA-256), exige sete parágrafos na ordem correta e confere a narrativa antes do acervo. Também verifica imagens, reflow, erros JavaScript, título visível após animação e acessibilidade, em Chrome, Firefox e WebKit. Evidências em `data/visual-review/historia-integral/`.

A correção foi validada em dez cenários locais e dez públicos (Chrome, Firefox, WebKit): sete parágrafos exatos e ordenados, título visível, imagens carregadas, sem overflow, erros JavaScript ou violações axe nos cenários auditados. Dez rotas públicas retornaram 200 sem cookies e HTML idêntico ao build. Preflight antes/depois preservou 432 assets dos outros clientes e áreas live. Lighthouse da História publicada: desempenho 97 mobile / 100 desktop; acessibilidade e boas práticas 100; SEO 69 pelo noindex intencional da prévia. Relatórios brutos em `data/visual-review/historia-integral/performance-published/`; métricas de laboratório, não API PageSpeed Insights nem CrUX.

## Cardápio: clássicos em destaque — 02/10/2026
A página foi refeita conforme a referência da seção 3 do PDF: “Os clássicos do Rodeio”, “Uma seleção de sabores que atravessa gerações.”, a descrição aprovada e “Confira o cardápio”. Duas fotos do Drive ainda inéditas no site: `rodeio (16) (1).jpg` (cortes e acompanhamentos, sem identificar o corte da foto como picanha) e `3M7A6213.jpg` (serviço do Arroz Rodeio). Proveniência em `briefing/entrada/cardapio-classicos-2026-10-02/fotos-selecionadas.json`. Nomes da picanha fatiada e do Arroz Rodeio são destacados em texto. Imagens AVIF responsivas, lazy loading e recorte proporcional; maior variante nova: 308.018 bytes.

A composição tem margens comuns, legendas alinhadas em desktop, sequência vertical no celular e encerramento dedicado ao cardápio completo e às reservas. Mantém cores, fontes locais e animações do site. Verificação específica: `scripts/verify-cardapio-classicos.mjs`; evidências em `data/visual-review/cardapio-classicos/`.
