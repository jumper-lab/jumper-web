# Rodeio Restaurante — revisão de outubro de 2026

## Fonte vigente
As diretrizes e os textos desta revisão vêm de `briefing/entrada/diretrizes-2026-10-02/RODEIO SITE (2).pdf`, lido nas 11 páginas, incluindo os links embutidos. Texto, links e seleção fotográfica estão arquivados na mesma pasta. `data/content.json` centraliza os textos aprovados e os dados das unidades.

## Entrega
- Home: “O clássico que se renova”, apresentação do novo momento e das duas casas, com novos registros do Jardins.
- Slideshow: seis fotos reais do acervo; mantida a ordem anteriormente aprovada (2, 5, 1, 3, 4, 6). Troca suave, carregamento progressivo e alternativa sem movimento.
- Menu: história, cardápio, eventos, reservas e as duas unidades; Home está acessível pela marca e aparece no menu móvel e no rodapé.
- História: narrativa integral do novo PDF distribuída na cronologia, incluindo certificação de 2001, inauguração do Iguatemi em 2011 e mudança do Jardins em 2026. Acervo com três fotos adicionais.
- Cardápio: texto simples, poucos pratos em destaque e link exato do LiveMenu recebido no PDF. Removida a fotografia do cardápio físico desatualizado.
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
Worker dev versão `1ca0ce0f-5064-4cf4-a400-c5f8e73a1869`, fonte `6fb174c7285b01f559f1a0a83046f6cac9fae5b5`. Os commits finais de evidências não alteram o pacote do site. A publicação oficial continua separada. Registro completo: `data/cloudflare-deployment.json`.
