# Principal Izi — preparação do código e dataLayer

Pedido de 12/10/2026, validado em 13/10/2026. Escopo: `izigym.com.br` e `www.izigym.com.br`, seguindo a arquitetura da PR #110. A página usa somente Izi. Configurar tags/destinos/envios e confirmar recebimento pertence ao `jumper-tracker`. Esta entrega prepara o site e abre PR; não publica site nem GTM.

## Instalação e fonte oficial

`src/data/tracking.json` controla `izi.enabled` e `GTM-TGQTFXTN`, sem leitura de flags da URL. O build Vite coloca o carregador no `head`, depois da declaração de caracteres, e o `noscript` como primeiro conteúdo do `body`. A inicialização preserva a mesma `window.dataLayer`, mensagens anteriores e comandos de consentimento; acrescenta contexto e uma inicialização GTM, reutilizando uma existente. Repetir o bootstrap não carrega outro container. Não há snippets ou envios próprios GA4, Ads, Meta ou Clarity, nem instalação Cative.

O inventário anterior do fonte, snapshot e navegador não encontrou carregadores GTM, emissores desses eventos, `gtag`, `fbq`, Clarity ou formulário funcional no principal. Não foi encontrado um mecanismo de consentimento próprio nesse pacote; a implementação conserva comandos existentes que possam ter sido enfileirados e não cria concessões de consentimento.

O fonte React foi comparado com o snapshot oficial antes da implementação: 31 de 33 arquivos idênticos byte a byte. Os dois restantes diferem apenas por espaços em uma string CSS de biblioteca no bundle e uma quebra de linha final em `placeholder.svg`. Os links e conteúdo comercial conferiram no navegador. O Hoster agora constrói esse fonte e valida o pacote antes de copiá-lo para `_official/izigym`; o snapshot antigo continua como referência histórica. A prévia pública `/izigym/` conserva seu pacote separado. O Worker, os domínios e os bindings não mudam nesta PR.

O apex já redireciona com HTTP 308 para `www`, preservando caminho e query. A rota foi testada com o Worker real em simulação local. A matriz React foi executada no hostname canônico `www`, com os assets locais do build de produção.

## CTAs instrumentados

| Evento | Placement | Componente e ação |
|---|---|---|
| `checkout_click` | `plan_card_izi_one` | Card Izi One → lista de planos Pacto. |
| `checkout_click` | `plan_card_izi_prime` | Card Izi Prime → mesma lista de planos Pacto. |
| `whatsapp_click` | `whatsapp_faq_contact` | “Falar com a equipe” na FAQ. |
| `whatsapp_click` | `whatsapp_floating_desktop` | Botão flutuante desktop. |
| `whatsapp_click` | `whatsapp_mobile_sticky` | WhatsApp da barra fixa mobile. |

Os atributos são `data-checkout`, `data-whatsapp` e `data-whatsapp-channel`. Os três links WhatsApp identificam `channel_id=principal_sales`. Não incluem telefone, mensagem ou URL WhatsApp no evento; o destinatário e a mensagem comercial originais ficam no href.

Menu/header, hero e barra mobile levam a `#planos` e permanecem navegação interna. Os CTAs principais do menu/header/barra recebem também `data-navigation` para identificação e teste. Não há saída Pacto nem link WhatsApp no rodapé atual: o contato telefônico, Instagram, mapa e retorno ao topo permanecem sem esses eventos.

## Contrato e atribuição

[`datalayer-contract.json`](./datalayer-contract.json) define campos, destinos permitidos, placements, exemplos sanitizados e o mapeamento esperado pelos trackers. Um handler delegado, guardado por página, atende clique, teclado e clique com botão do meio. Remontagens, componentes lazy e transições de rota usam o mesmo handler. Eventos cancelados, outros destinos e links internos não são classificados como contratação.

`checkout_click` leva `site_id=principal`, `izi_enabled`, `placement`, `checkout_url` sanitizada e atribuição disponível no mesmo push. As funções puras `readCampaign`, `trackingCampaign` e `trackingCheckoutUrl` da PR #110 são importadas diretamente, sem alterar o fonte da Cerro Corá. O bundle elimina o código Cative não utilizado. `gbraid`, `wbraid`, `dclid` e `msclkid` complementam os identificadores já aceitos; usam a mesma inspeção de valores na telemetria. Campos UTM pessoais conhecidos e valores com formato de contato/documento são excluídos do evento e da URL sanitizada. Identificadores numéricos de campanha em `utm_id` são preservados.

Campanha persiste em armazenamento de sessão próprio do principal. Uma chegada com nova campanha ou identificador substitui a anterior; somente os parâmetros adicionados pelo runtime são retirados quando se tornam obsoletos. O href mantém parâmetros comerciais e `_gl` inserido tardiamente pelo Google. A telemetria omite `k`, `_gl`, credenciais, fragmento e parâmetros pessoais/alheios. Falhas de armazenamento ou do consumidor de `dataLayer` não cancelam a navegação. WhatsApp não recebe parâmetros de campanha novos.

`plan_id` e `unit_id` não são emitidos. Os IDs locais 5/6 identificam cards, não uma correspondência confirmada na Pacto. O `un=1` existente fica no destino comercial e na URL sanitizada, sem afirmar uma identidade externa validada. Não foram fabricados eventos `Lead`, `Purchase`, `lead_submit`, `begin_checkout`, `purchase` ou `InitiateCheckout`.

## Observações comerciais — preservadas para confirmação

1. Ambos os cards levam a `/planos?un=1&k=…`, sem seleção `pl` nem cupom. O clique mede saída para a lista Pacto; não prova que o plano exibido foi selecionado lá. A Cerro Corá usa `/checkout` com `pl=2` e `cupom=0,99_IZI`; não foi presumida equivalência entre as ofertas ou IDs.
2. Cards e FAQ do principal anunciam Izi One a R$ 157/mês e Izi Prime a R$ 27 no primeiro mês, depois R$ 167/mês. Esses valores não foram alterados nem confrontados com um cadastro externo da Pacto nesta entrega.
3. O Open Graph ainda diz “a partir de R$ 167”, e o JSON-LD tem `priceRange="R$ 167 - R$ 187"`; isso diverge dos valores atuais dos cards/FAQ. Os metadados foram preservados para confirmação comercial antes de corrigi-los.

## Validação e evidências

71 testes automatizados passaram: 21 do principal (Vitest/Testing Library), 29 do Hoster e 21 de regressão Cerro Corá. Build completo Hoster, build final principal, lint e tipos do aplicativo/configuração passaram. A declaração dos itens da galeria recebeu `as const` para resolver a discriminação de tipos preexistente; o JavaScript e o conteúdo visual não mudam por essa declaração.

[`2026-10-13/browser-validation.json`](./2026-10-13/browser-validation.json) registra quatro cenários: desktop 1440×900 e celular emulado 390×844, cada um com Izi ativo/desligado em nova página. Em cada cenário, cinco CTAs, Enter, dois cliques rápidos e um clique após remontagem real de rota produziram nove eventos para nove interações. Quatro CTAs visíveis receberam cliques nativos; a variante WhatsApp oculta em cada layout recebeu despacho programático, identificado na evidência. Menu mobile foi aberto/fechado repetidamente. Links internos e scroll não emitiram eventos, e o número de listeners permaneceu igual após a remontagem.

O carregador ativo gerou um pedido GTM e um startup por página. Desligado, não gerou pedido/startup; eventos lógicos continuaram com `izi_enabled=false`. A fila anterior e o comando de consentimento de teste permaneceram intactos. O texto comercial e os fingerprints dos links coincidiram com o inventário anterior. Não houve erro de página nesses cenários.

Seis saídas nativas adicionais (Pacto por clique/Enter e WhatsApp, nos dois tamanhos) observaram um push antes da navegação. Preservaram chave/unidade, ausência anterior de plano/cupom selecionado, campanha, `_gl`, destinatário e mensagem WhatsApp. Destinos foram simulados: não houve contratação ou envio de conversa. Um teste adicional atrasou o carregador quatro segundos e observou evento e navegação antes de a biblioteca ficar disponível. A proteção de dados foi conferida com valores sintéticos; com JavaScript desativado, o fallback fez um pedido `ns.html` Izi.

[`2026-10-13/package-scope.json`](./2026-10-13/package-scope.json) registra o principal como única diferença nova entre páginas protegidas. Oito páginas coincidem byte a byte com suas respostas publicadas. A diferença restante, no pacote Vila Romana, já é a combinação de hashes revisada na promoção da Cerro Corá; não foi modificada por esta PR nem liberada por um novo bypass. A publicação futura do principal exige o procedimento e a revisão específica do Hoster; nenhum release/preflight de deploy foi flexibilizado aqui.

Emissão observada significa o push do código real, com bibliotecas/coletores externos bloqueados ou simulados. Esta validação não executa as tags reais, não valida duplicação dentro do GTM e não confirma recebimento GA4/Meta/Ads/Clarity. Esses itens pertencem ao `jumper-tracker` e não são pendências do aceite de preparação do código.

## Arquivos alterados

- Configuração/carregador/runtime: `src/data/tracking.json`, `src/tracking/bootstrap.mjs`, declaração `.d.mts`, `src/tracking/principal.ts`, `src/components/TrackingAttribution.tsx`, `src/main.tsx`, `src/App.tsx`.
- CTAs/metadados estáveis: `PlanCard`, `PlanosSection`, `FAQSection`, `WhatsAppButton`, `StickyMobileCTA`, `Header`, `MobileNav` e `src/data/plans.ts`. `GallerySection` contém somente a correção de declaração de tipos.
- Build/testes React: `vite.config.ts`, `vitest.config.ts`, `tsconfig.app.json`, `package.json`, lockfile e `tests/tracking.test.tsx`.
- Preparo Hoster: `rodeio-restaurante/package.json`, `scripts/build-principal.mjs`, `scripts/prepare-principal.mjs`, `scripts/stage-hoster.mjs` e `scripts/tests/principal-build.test.mjs`.
- Documentação/evidências: README, este relatório, contrato JSON e os registros de inventário, reconciliação, testes, navegador e escopo do pacote.

Para desativar Izi, usar `izi.enabled=false`, reconstruir e iniciar nova página; reativar usa `true` nas mesmas condições. Para retornar ao preparo anterior, restaurar por revisão a origem snapshot do principal e seguir o fluxo autorizado de publicação. Nenhuma alteração de destino ou preço integra esse controle.
