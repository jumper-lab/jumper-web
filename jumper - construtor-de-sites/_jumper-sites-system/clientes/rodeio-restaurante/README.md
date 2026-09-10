# Rodeio Restaurante

## Compatibilidade entre navegadores — 09/09/2026

Auditoria automatizada concluída em Chromium, Firefox e WebKit, nos viewports 390 × 844 e 1440 × 900. Foram executadas 78 verificações: carregamento das 10 páginas, conteúdo visível, ausência de overlay e erros de console, imagens carregadas, ausência de overflow, heros com 100% do viewport, menu mobile, navegação, lightbox com anterior/próxima/teclado/retorno de foco e seleção de unidade nas reservas. Resultado: 78 aprovadas, nenhuma falha.

Relatório reproduzível: `scripts/cross-browser-audit.mjs`. Evidência: `data/visual-review/cross-browser/report.json`. WebKit representa o motor do Safari, mas não substitui teste manual no Safari real; Edge não está instalado nesta máquina e foi coberto apenas pelo motor Chromium. Serviços externos de Tagme, Live Menu, Google Maps e formulário de eventos não foram enviados nem exercitados de ponta a ponta. Sem novo deploy.

## Entrada única das fotos — 09/09/2026
Removida a variação de opacidade e o atraso da entrada das fotografias de conteúdo; mantido somente o afastamento suave. O estado inicial é preparado fora do viewport, evitando mostrar a imagem pronta antes de reiniciar o zoom após decode. Molduras com imagens excluídas da animação genérica de texto. Reentrada nos dois sentidos e movimento reduzido conferidos em 390/1440px. Nenhum arquivo ou regra das heros foi alterado. Sem deploy.

## Revisão editorial geral — 09/09/2026
Revisadas as dez páginas e os componentes de navegação, rodapé, reservas e galerias à luz do briefing normalizado e payload. 43 ajustes registrados com antes/depois em `data/text-review.json`: clareza, precisão histórica, menos repetições, CTAs compatíveis com a ação e mensagens de uso. Texto e quebras da hero da home preservados. Uma segunda leitura factual independente validou a revisão.

Build e Astro check sem diagnósticos; 30 combinações de página/viewport (320, 768 e 1440px) sem overflow, além da conferência visual de Eventos e Reservas. Evidência: `data/visual-review/text-review/report.json`. Permanecem pendentes confirmação do número vigente de Jardins, horários por unidade e atribuição do telefone geral; dados visíveis seguem o briefing. Sem novo deploy ou medição PageSpeed.

## Estabilidade das heros internas — 09/09/2026
A exclusão de ancoragem de rolagem foi movida de `.hero-home` para a regra compartilhada `.hero`. Evita compensações de scroll provocadas pela entrada dos textos nas páginas internas, mantendo a borda inferior no viewport. Animações e dimensões preservadas. Verificação: `scripts/verify-internal-hero-edges.mjs`; evidência em `data/visual-review/hero-entrance/internal-edge-report.json`. Sem deploy.

## Reentrada das fotografias — 09/09/2026
O movimento de aproximação agora se repete ao subir e descer. Observa a moldura fixa: rearma somente após saída completa e inicia a partir de 8% de visibilidade, evitando reinícios em pequenos movimentos. Saída cancela animação fora da tela e invalida decode pendente; textos mantêm entrada única. Validado em 390/1440px nos dois sentidos, sem reinício enquanto visível e respeitando movimento reduzido. Build/check aprovados. Evidência: `data/visual-review/photo-motion/replay-report.json`. Sem deploy.

## Transições das lightboxes — 09/09/2026
Troca por dissolve de 420ms após decode fora da tela, mantendo a foto anterior durante carregamento. Área de imagem estável e status/legenda com espaço reservado evitam saltos dos controles entre retratos e paisagens. Requisições antigas ignoradas, camadas removidas ao terminar/fechar; movimento reduzido troca imediatamente. Validado em Cardápio, Jardins e Iguatemi em 320/1440px com rede atrasada, comandos rápidos, Escape, foco, falha e recuperação. Evidência: `data/visual-review/lightbox-transitions/report.json`. Build/check aprovados. Sem deploy; PageSpeed não repetido.

## Refinamento das entradas de fotos — 09/09/2026
Substituída a revelação por recorte por um afastamento suave dentro de uma moldura fixa: escala 1.065→1 nas fotos editoriais (1600ms), 1.035→1 nas galerias (1100ms). Opacidade inicial 0.82, intervalos de até 120ms; imagem não some nem expõe bordas vazias. Photo agora fornece a moldura com overflow clip e sem ancoragem de rolagem. Preservados decode antes do efeito, execução única e respeito a movimento reduzido. Sem deploy ou nova medição PageSpeed.

## Movimento das fotografias — 09/09/2026
Todas as fotos editoriais do componente Photo recebem revelação por clip-path dentro dos próprios limites após decode: editorial 1200ms, galeria 850ms, intervalos limitados a 195ms. Sem deslocar molduras ou esconder imagens permanentemente. Heros internas recebem o mesmo assentamento de escala 1.035→1 da home. Efeitos únicos, cancelados com movimento reduzido e pagehide. Validação: 34 fotos em oito rotas, todas animadas e concluídas sem overflow; mobile conferido. Build e check aprovados. Evidência: `data/visual-review/photo-motion/report.json`. Sem deploy ou nova medição de PageSpeed.

## Entrada elaborada da home — 09/09/2026
Sequência CSS desde o primeiro paint: foto de escala 1.035 para 1 em 1800ms, título revelado em duas linhas com intervalos de 130ms, descrição, ações e indicação de rolagem em sequência (último início em 660ms). Menu preserva a entrada coordenada. Sem deslocar a raiz nem o contêiner da hero; overflow-anchor continua desativado nela. Foco revela controles e movimento reduzido remove a sequência. Nove recargas em 320/1440/1836px com scrollY zero e hero 100vh; build e Astro check aprovados. Não houve nova medição de PageSpeed nem deploy.

## Borda da hero durante transições — 09/09/2026
Removido o deslocamento vertical dos snapshots de página (`menu-page-out/in`), que podia expor o canvas claro na borda de uma hero de 100vh. Também desativada a ancoragem de rolagem na hero da home: o movimento do texto estava provocando compensações de scroll ao recarregar. A validação agora exige scrollY zero em todos os frames. A transição global passa a alterar somente opacidade; a entrada local de texto/menu permanece. Sem deploy. Verificação por frames em recargas: `scripts/verify-hero-edge.mjs`, evidência em `data/visual-review/hero-entrance/edge-report.json`.

## Entrada da navegação — 09/09/2026
Somente na home: logo entra primeiro; links e controles seguem com atrasos de 70–170ms, opacidade e deslocamento vertical de 7px, duração de 560ms. Barra permanece fixa; animação CSS desde o primeiro paint, sem reinício pelo JavaScript. Foco no cabeçalho revela imediatamente os controles; movimento reduzido desativa o efeito. Build aprovado; desktop/mobile e abertura do menu conferidos. Sem deploy.

## Entrada da hero — 09/09/2026
A home inicia uma única entrada CSS de 650ms desde o primeiro paint. Foi excluída da entrada tardia por JavaScript, que podia ocultar novamente conteúdo já pintado. Foto permanece fixa, hero mantém suas dimensões. Validado em 320/1440px com módulo JS atrasado 1200ms: opacidade crescente sem reinício. Sem JS o conteúdo aparece; movimento reduzido desativa a animação. Build e Astro check aprovados. Evidência: `data/visual-review/hero-entrance/report.json`. Sem novo deploy; performance não remensurada.

## Logos — 09/09/2026
Logo sem símbolo aplicada ao cabeçalho, rodapé (branca), dados estruturados e ícones. Quatro variantes preservadas em `public/logos/`: `logo-com-simbolo`, `logo-sem-simbolo` e respectivas versões `-branca`, em PNG transparente e SVG com matriz raster incorporada (não são vetores traçados). Original preservada em `public/logo.png`. A variante sem símbolo foi gerada pela ferramenta integrada imagegen; prompt: remover o quadriculado, preservar RODEIO e desde 1958, fundo branco uniforme e sem texturas. Máscaras SVG definem as cores e transparência para uso no site. Sem novo deploy; PageSpeed não medido nesta alteração.

## Galerias completas por restaurante — 09/09/2026
As páginas das unidades agora têm todas as fotos de suas respectivas pastas do Drive: Jardins15/15 e Iguatemi5/5. Conferência por ID registrada em `data/visual-review/restaurant-galleries/coverage.json`. Essa coleção completa é uma exceção solicitada à regra anterior de não repetir fotos editoriais: imagens do hero e chamadas também aparecem no álbum da unidade.

Galerias com grade3/2/1colunas, miniaturas AVIF lazy, ampliação sob clique, anterior/próxima, contador, setas do teclado, Escape e retorno do foco. As20 fotos foram percorridas em320/768/1440px; zero overflow. A galeria de Cardápio também foi verificada. Astro check:47arquivos, zero diagnósticos; build aprovado. Lighthouse não repetido nesta rodada. Sem novo deploy.

Previews: http://127.0.0.1:4321/restaurantes/jardins/#galeria e http://127.0.0.1:4321/restaurantes/iguatemi/#galeria .

## Atualização de fotografias — 09/09/2026
Curadoria concluída com **26 fotos reais diferentes em 26 posições editoriais**. Heros exclusivos por página; fotos de cardápio, galerias, diretório e chamadas da home não se repetem. A fachada permanece na home. O hero de História usa um detalhe contemporâneo do ambiente, corretamente legendado; acervo histórico de menor resolução fica no conteúdo.

As matrizes foram refeitas a partir dos JPEGs originais, sem nova compressão com perda intermediária. Ficam em `briefing/entrada/matrizes/`; o site entrega AVIF quality 60 em tamanhos responsivos. Os heros têm recortes de 9:16, 4:5 e 16:9, prioridade alta e cobertura de 100vh. O pós-build exclui matrizes não referenciadas do artefato; nunca as fotos finais utilizadas.

Lighthouse local mobile: **Home 94; História 100; Cardápio 98; Restaurantes 98; Jardins 99; Iguatemi 98; Eventos 100; Reservas 98.** Home desktop: **100**. Acessibilidade e boas práticas: **100 em todas as medições**. SEO: **69**, devido ao noindex do preview. O LCP mobile da home continua em aproximadamente **3,2s**, acima da meta de 2,5s; não declarar todas as métricas verdes. São medições locais, não PageSpeed Insights online nem dados de campo. Os resultados anteriores abaixo são históricos.

Validação atual: 48 combinações de página/viewport; 26 fotos distintas conferidas no HTML final; build com 10 páginas e 261 arquivos; Astro check sem diagnósticos; client gate aprovado. Relatório: `data/visual-review/photo-refresh/summary.json`. Galerias e links mantêm as rotas existentes. Sem novo deploy.

Preview: http://127.0.0.1:4321/?revisao=fotos

Site Astro 7 estático, modelo M4 e personalidade A. O redesenho visual de 08/09/2026 está publicado para desenvolvimento em https://site.jumper.dev.br/rodeio, diretamente no Cloudflare.

## Abrir e desenvolver

Preview revisado: http://localhost:4321

Use Node 24 e execute na pasta deste cliente:

```sh
npm ci
SITE_URL=https://site.jumper.dev.br BASE_PATH=/rodeio npm run build
npm run preview
```

Para editar com atualização automática: `npm run dev`. O preview fica em 127.0.0.1:4321. `SITE_URL` controla canonical, Open Graph e sitemap; não controla a URL local do servidor. A indexação permanece desativada, com `noindex, nofollow` e robots Disallow.

## O que foi redesenhado

As dez páginas foram revistas: Início, História, Cardápio, Restaurantes, Jardins, Iguatemi, Eventos, Reservas, Privacidade e 404. O briefing desativa blog; não há área administrativa, preços, avaliações ou depoimentos inventados.

- **Home:** fachada real em toda a primeira dobra, texto claro sobre a fotografia, reserva e descida discreta. A experiência é integrada ao serviço; gastronomia em marrom; unidades em linhas alternadas; memória em papel e convite fotográfico para eventos.
- **Cabeçalho e menu:** marca central entre dois grupos de navegação no desktop; reserva permanece visível inclusive em 320px. Painel móvel marrom com índices, Fechar sticky, teclado, Escape e retorno de foco.
- **História:** introdução lateral e cronologia editorial com acervo. **Cardápio:** serviço, nomes dos clássicos e galeria assimétrica. **Eventos:** ambiente real, contato agrupado e ocasiões em linhas tipográficas.
- **Unidades:** endereço, horários, rotas e reserva agrupados; galeria com escalas próprias. **Reservas:** seleção da casa e consulta de disponibilidade em duas etapas claras. **Privacidade:** índice e artigos. **404:** mensagem e ações proporcionais.
- **Rodapé:** encerramento marrom, unidades e contatos reais. Convites repetidos foram removidos. CTA principal respeita Jardins/Iguatemi e, em reservas, volta à escolha sem recarregar a página.
- **Motion e acabamento:** entradas de texto aprovadas preservadas; fotos estáveis com dissolução após carregar. CSS obsoleto removido e estilos divididos por composição.
- **Funcionamento preservado:** galerias com ampliação real e fallback, reservas e mapas sob demanda, navegação sem JavaScript, fontes locais, noindex e dados estruturados coerentes com o briefing. Nenhuma reserva ou orçamento foi enviado.

Heros continuam exatamente em 100vh, incluindo o cabeçalho, em todas as páginas. A home usa imagem imersiva também no celular; o tamanho do arquivo considera a altura de cobertura para preservar nitidez.

## Resultado da revisão

Duas rodadas de **90 combinações de página e viewport** passaram, com **nove grupos funcionais** na rodada final e **20 verificações axe WCAG 2.2 sem violações**. Oito condições extremas de reflow/foco e seis verificações adicionais dos recortes da home também passaram. Houve inspeção visual real de todas as páginas, desktop e mobile, além de revisão independente. Capturas finais confirmam a remoção de convites duplicados, o CTA contextual do rodapé e os recortes da fachada.

Lighthouse 13.4.1, laboratório local: três amostras para cada página mobile e uma para a home desktop. Mobile usa Slow 4G simulado e CPU 4×. Todas as amostras foram preservadas, inclusive as ruins.

| Condição | Desempenho | Acessibilidade | Boas práticas | SEO | LCP mediano |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home mobile | 94 | 100 | 100 | 69 | 2,749 s |
| Home desktop | 100 | 100 | 100 | 69 | 0,666 s |
| Restaurantes mobile | 80 | 100 | 100 | 69 | 2,158 s |

**A meta de desempenho global ainda não foi atingida.** Home mobile variou de 87 a 96 e o LCP permaneceu acima de 2,5 s. Restaurantes variou de 61 a 91, com TBT entre 362 e 1.759,5 ms. A máquina tinha atividade concorrente em renderers do Chrome habitual; a origem foi conferida e nenhum processo/aba do usuário foi alterado. Isso limita a comparação, mas não prova a causa de cada resultado nem autoriza descartar amostras. Revalidar em ambiente sem concorrência antes de afirmar “PageSpeed todo verde”.

A imagem LCP da home mobile passou de 296.566 para 110.257 bytes por recorte responsivo e qualidade 55, preservando resolução e aparência conferida. As demais fotos continuam em qualidade 60. A transferência total caiu de 592.616 para 406.479 bytes em relação ao redesenho antes do recorte (−31,4%). Frente ao layout anterior, de 339.131 bytes, a nova composição transfere 19,9% a mais; o ganho visual não foi apresentado como ganho de desempenho sobre essa versão.

SEO 69 decorre do bloqueio intencional de indexação. A API PageSpeed retornou 429 na revisão anterior; não há pontuação online nova nem dados CrUX/INP. Lighthouse é laboratório, e 100 em acessibilidade não certifica conformidade completa.

Validações finais: Astro check: 39 arquivos sem erros/avisos/hints; build: 10 páginas; client gate aprovado; artefato: 116 arquivos conferidos, sem conteúdo interno ou URLs localhost. Nenhum deploy executado.

## Validação reproduzível

```sh
npm run check
SITE_URL=https://site.jumper.dev.br BASE_PATH=/rodeio npm run build
node scripts/verify-revision.mjs redesign-final
node scripts/verify-extreme-reflow.mjs redesign-pass1
node ../../scripts/client-gate.mjs rodeio-restaurante
npx wrangler deploy --dry-run
```

Os testes usam Playwright e Google Chrome instalado. O preview precisa estar rodando. A verificação simula demora/erro de terceiros, sem reservar ou enviar orçamento. Em ambiente com sandbox, iniciar Chrome pode exigir autorização do ambiente.

Evidências atuais:
- `data/visual-review/revision/redesign-pass1/`: primeira rodada e 90 screenshots.
- `data/visual-review/revision/redesign-final/`: segunda rodada, fluxos e capturas finais.
- `data/visual-review/revision/extreme-reflow-redesign-pass1.json`: foco com reflow extremo.
- `data/visual-review/revision-design/redesign/review.md`: revisão visual independente.
- `data/visual-review/redesign/interiors-pass1/`: inspeção por seção das internas.
- `data/visual-review/redesign-performance/summaryfinal.json`: métricas atuais; relatórios brutos preservados.
- `data/visual-review/redesign/portrait-delivery/`: verificação do recorte e qualidade em alta densidade.
- `data/visual-review/revision-briefing-findings.json`: fontes e divergências comerciais.
- `data/visual-quality-audit.json`: conclusão e limites consolidados.

## Arquivos de operação

Conteúdo: `data/content.json` e textos editoriais de `src/pages/`. Direção: `data/final-design-system.json` e `data/final-site-build-prompt.md`. Configuração: `jumper.config.json`.

CSS: `src/styles/global.css` para fundamentos; `hero.css`, `navigation.css`, `home.css`, `houses.css`, `interiors.css` e `footer.css` para as composições. Fontes: `src/assets/fonts/`. Fotos: `src/assets/`, com originais isolados em `briefing/entrada/originais/`. Inventários: `drive-inventory.json` e `asset-selection.json` dentro de `briefing/entrada/`. Não misturar assets com outros clientes.

Os previews de DS em `data/design-system-previews/` são HTMLs locais; o preview final foi atualizado e contém link para o site revisado.

## Integrações

Reservas: Tagme por unidade, carregado somente após clique; a confirmação pertence ao fornecedor. Alternativas: https://rodeiosp.com.br/reservas/jardins/ e https://rodeiosp.com.br/reservas/iguatemi/.

Cardápio completo: https://livemenu.app/menu/56c778030896b3cd13c609e5. Eventos: https://rodeiosp.com.br/eventos/. Maps entra por interação; link de rotas continua disponível. Telefone geral recebido: (11) 3474-1333.

## Pendências do cliente

1. **Jardins:** briefing informa Haddock Lobo, 1448; https://rodeiosp.com.br/jardins/ informa 1498. Confirmar endereço vigente e mudança de 2026. Não foi alterado por suposição.
2. **Horários:** os do briefing coincidem com a página Jardins, mas divergem da página de reservas Jardins e dos horários de Iguatemi. Detalhes e URLs estão na auditoria do briefing. Confirmar por unidade.
3. **Telefone Iguatemi:** https://rodeiosp.com.br/iguatemi/ informa (11) 2348-1111; o briefing trouxe somente 3474-1333. Confirmar se o atendimento deve ser centralizado ou individual.
4. **Marca:** a ingestão registrou manual inacessível e pasta de logos vazia. O site usa a marca do site oficial e laranja #BB4B20 interpretado do briefing; não há certificação de conformidade com manual.
5. **Publicação definitiva:** confirmar domínio próprio, dados comerciais e autorização de indexação. Fotos históricas têm resolução inferior ao ensaio recente; mantidas com legenda e ampliação moderada.

Em viewports extremos equivalentes a zoom elevado (360×225 e 390×320), o hero de altura fixa usa rolagem interna de texto; o CTA foi verificado por foco de teclado. Nos nove viewports principais testados não há rolagem interna. Compatibilidade de transições depende do navegador, com navegação convencional como fallback.

## Cloudflare

Endereço de desenvolvimento: https://site.jumper.dev.br/rodeio. O Worker `jumper-hoster` serve os assets estáticos diretamente pelo Cloudflare; a raiz do domínio exibe o painel de projetos da Jumper e o Rodeio fica isolado em `/rodeio/`. A Vercel não participa do tráfego.

Para compilar e publicar:

```sh
npm run build:cloudflare
npx wrangler deploy
```

O build usa `SITE_URL=https://site.jumper.dev.br` e `BASE_PATH=/rodeio`. O Worker remove o prefixo apenas para localizar os arquivos em `dist/`; URLs públicas, canonical, Open Graph e navegação mantêm `/rodeio`. Nunca enviar briefing, originais, credenciais, scripts internos ou `node_modules` para a hospedagem.

## Ajuste de hero — 09/09/2026
Fotografias da home e de todas as internas agora preenchem a largura útil inteira e 100vh, atrás do cabeçalho fixo. Texto sobreposto com contraste escuro; removidas as molduras e a divisão em colunas. Link discreto de descida em todas as 10 páginas, com alvo real (rodapé na 404). Privacidade e 404 preservam abertura tipográfica. Validação: 60 combinações de página/viewport, sem overflow, sobreposição de CTA ou rolagem interna nos tamanhos verificados; todas as âncoras clicadas. Astro check: 40 arquivos, zero diagnósticos; build aprovado. As métricas Lighthouse anteriores são históricas e não representam esta nova composição. Recortes de fotografias inteiras e limite de resolução do acervo permanecem sujeitos à proporção da tela. Versão local, sem deploy.

## Clássicos à mesa e menu — 09/09/2026
Seção de gastronomia refeita: prato principal à esquerda, título e CTA agrupados à direita e sobremesa em detalhe compacto; removidos composição escalonada e aforismo solto. No celular, sequência texto → prato → sobremesa. Menu desktop reduzido para 13–15px. Build aprovado e capturas conferidas em 320, 390, 768, 1024, 1440 e 1808px, sem overflow. Preview direto: http://127.0.0.1:4321/?revisao=classicos#classicos . Sem deploy.

## Correção de alinhamento de Clássicos à mesa — 09/09/2026
Marcador 02 deslocado para o topo esquerdo, no mesmo eixo de 01 e 03. Cabeçalho comum para título e introdução; fotografias com topo/base alinhados, sem escalonamento; legendas uniformes. Mobile em sequência linear. Seis larguras verificadas (320,390,768,1024,1440,1819): zero overflow; marcadores com coordenada X idêntica; imagens com diferenças de topo e base de 0px a partir de 768px. Build aprovado. Evidência: data/visual-review/redesign/cuisine-alignment.json. Lighthouse anterior à mudança de layout desta seção não foi repetido.
