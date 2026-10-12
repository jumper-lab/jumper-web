# Cerro Corá — entrega de código e migração GTM

Briefing aplicado: `jumper-tracker/clients/izigym/PLANO-PARIDADE-PRINCIPAL-CERROCORA.md`, atualizado em 12/10/2026, e seu complemento GTM como hub. Escopo: somente o oficial Cerro Corá. Esta entrega prepara o código; não publica o site nem versões GTM e não conclui a ativação/recebimento dos destinos.

## Configuração entregue

`data/cerrocora-tracking.json` centraliza `izi.enabled` e `cative.enabled`, ambos `true`, e os dois IDs GTM. O Hoster aplica essa configuração somente ao HTML `hoster-dist/cerrocora/index.html`. Nenhuma ferramenta Izi é instalada diretamente; os destinos ficam no respectivo GTM.

O bootstrap preserva a fila existente, publica os controles sem criar um novo evento custom, carrega cada container uma vez e compartilha um único `gtm.js`. O handler existente dos oito links continua emitindo um único `checkout_click`. `site_id`, os controles e `cative_checkout_source` ficam no mesmo push. O evento preserva campanha e destino, retirando da URL de telemetria a chave `k`, credenciais, fragmento e parâmetros alheios. O href comercial mantém unidade, plano, chave e cupom originais. `utm_*`, `gclid` e `fbclid` continuam com os valores existentes; nenhum preço/valor/receita foi acrescentado.

Os legados Cative permanecem ativos porque o substituto ainda não foi validado: `cative.legacy.ga4Direct.enabled = true` e `cative.legacy.metaCheckout.source = legacy`. O `InitiateCheckout` direto agora usa `trackSingle` para `922916223883872` exclusivamente. Esses IDs no código são temporários da migração, não uma nova instalação Izi. Após validar os caminhos GTM, uma segunda alteração deve retirar o bootstrap/chamada legados; trocar flags apenas não conclui a arquitetura final.

Para desligar Cative em teste, alterar somente `cative.enabled` para `false`, reconstruir e abrir uma nova página/sessão. Nenhum GTM, GA4 direto ou chamada Meta Cative será iniciado por esse código; tags exclusivamente no container também deixam de carregar. Não existe controle por query string nem tentativa de descarregar um container já executado. Reativar requer `true`, novo build e nova sessão.

## Auditoria anterior

[`2026-10-12/inventory-before.json`](2026-10-12/inventory-before.json) registra URLs, hashes e versões da coleta pública realizada antes das mudanças:

- Izi publicado v23: Google tag GA4 7, base Ads 8, Meta PageView 15. Não havia mapeamento `checkout_click` nem novo Clarity. As regras de checkout/venda existentes da LP/Pacto não foram alteradas.
- Cative publicado v10: Google tag GA4 27, Meta variável 20, Clarity 23. A tag GA4 tem o mesmo ID do bootstrap direto. Isso comprova duas configurações, sem comprovar dupla contagem.
- Os runtimes dos templates Meta de ambos contêm `trackSingle`/`trackSingleCustom`. O broadcast próprio da página foi isolado no caminho oficial.
- Na sessão Chrome disponível, o container Izi aparecia na conta Izi GYM - Holding, sem alterações pendentes. O container Cative não apareceu na lista acessível; a coleta de sua versão foi pública. Não houve edição/publicação em nenhum GTM.
- Não foi encontrado endpoint AWS no fonte próprio ou recursos publicados dos containers inspecionados. A dependência de configurações carregadas pelo pixel/rede ainda precisa de inventário em runtime; ausência nesses arquivos não comprova ausência de requisições. Nenhuma integração foi copiada.

## Configurações GTM necessárias

[`gtm-change-plan.json`](gtm-change-plan.json) é um plano declarativo, **não um arquivo de importação GTM**. Inclui tags, destinos, variáveis, parâmetros e filtros exatos para configurar nos templates. Responsáveis: Jumper/admin Izi e administrador autorizado Cative.

1. Reutilizar as bases já publicadas Izi, verificar contagem e consentimento, e acrescentar GA4 `checkout_click` e Meta custom dirigido ao pixel Izi. Usar o evento existente; não criar outro listener. Filtrar hostname oficial, `site_id=cerrocora` e `izi_enabled=true`. Não duplicar `GT-MQRDQBSX`/AW nem usar labels Ads de venda.
2. Preparar/publicar no GTM Cative o `InitiateCheckout` somente para `cative_checkout_source=gtm`, hostname/site corretos e Cative ativa. Campo ausente/legacy não dispara a tag substituta. Preservar a tag Meta custom atual. Os controles de migração são internos; não mapeá-los como parâmetros de plataformas.
3. Manter configurações e exigências de consentimento dos templates. O código não concede consentimento, não altera defaults e não apaga mensagens existentes. Não foi identificado CMP próprio no fonte inspecionado; consentimento/recebimento dos containers continuam sujeitos a validação em Preview.

| Ocorrência | Izi via GTM | Cative durante a transição |
|---|---|---|
| Visualização | GA4 `page_view`, Meta `PageView`, base Ads existentes | Google tag existente + legado GA4 preservado até validação; Meta PageView e Clarity existentes |
| `checkout_click` | Nova tag GA4 + Meta custom; **configuração/publicação pendentes** | Meta custom atual via tag 20; não acrescentado evento GA4 |
| `InitiateCheckout` de saída | Nenhum | `trackSingle` legado; futuramente tag Cative filtrada por origem |
| Clarity | Nova tag oficial necessária, com restrição abaixo | `ytjf3498ao` preservado |

## Clarity: conflito confirmado no script, recebimento pendente

Ambos os scripts públicos consultados em 12/10/2026 têm a mesma proteção: se `clarity.v` ou `clarity.t` já existe, registram `dup.<projectId>` e retornam antes de iniciar o segundo coletor. A execução controlada dos scripts em ambas as ordens confirmou um `start` para o primeiro projeto e `dup` para o segundo. Isso não é um teste de recebimento em dashboard.

O plano GTM usa o template oficial Izi `ywlrxh4o91`, limitado a Cerro Corá, Izi ativa e Cative **desativada**. Enquanto ambos ficam ativos, preservar Cative e deixar Clarity Izi pendente. Não confiar na ordem de carregamento assíncrono para escolher o projeto nem tentar contornar o guard do SDK. A coleta simultânea nos dois projetos não foi comprovada e bloqueia o aceite completo; a referência oficial também protege contra segunda inicialização: [SDK Clarity](https://github.com/microsoft/clarity/blob/master/packages/clarity-js/src/clarity.ts).

## Troca e retorno

1. Guardar versões compatíveis do site e GTMs. Baselines públicos: Izi v23, Cative v10; hashes registrados no inventário. Registrar novas versões antes de alterar flags.
2. Publicar primeiro a tag Cative que exige origem `gtm`. Em modo `legacy`, apenas o direto dispara; em modo `gtm`, apenas a substituta. Uma página antiga, sem marcador, nunca deve disparar a substituta.
3. Em sessão controlada, testar `ga4Direct.enabled=false` e confirmar os pageviews/eventos existentes pela tag 27: destino, parâmetros, contagem, consentimento e independência do legado. Não desligar esse caminho em produção sem a evidência.
4. Em sessão controlada, mudar `metaCheckout.source` para `gtm`, validar continuidade/contagem/recebimento e então promover. Nunca habilitar ambos os emissores para a mesma ocorrência.
5. Antes da limpeza dos legados, retorno por ferramenta: `ga4Direct.enabled=true` ou `metaCheckout.source=legacy`, mantendo o filtro da tag Cative. Depois de remover os legados, retorno exige restaurar **site e containers compatíveis**; uma flag não recria o código removido. Guardar e testar essas versões. Conservar o marcador `gtm` enquanto páginas antigas puderem estar abertas ou em cache.

## Evidências e limites

Os testes locais cobrem os oito placements, um push por ocorrência, repetição do setup, cliques rápidos, `pageshow`/campanha, armazenamento bloqueado/corrupto, URL sanitizada, fila existente, controles, exclusividade de origem e empacotamento que falha se os snippets anteriores não forem reconhecidos. O teste com Meta tardio comprova que navegação/evento lógico não bloqueiam; recebimento do legado ainda depende da biblioteca disponível no clique.

Executar a suíte após `npm run build`: `npm test` em `izigym-lp`. Os testes do Hoster verificam preservação das prévias e fronteiras de publicação. O manifesto das prévias conserva os mesmos snapshots de 08/10; somente hashes dos candidatos gerados precisam acompanhar o novo módulo. Os arquivos de snapshot não foram substituídos pelo oficial.

[`2026-10-12/tests-summary.json`](2026-10-12/tests-summary.json) registra build completo, 18 testes da LP e 25 testes do Hoster aprovados. Na conferência local Chrome, com destinos simulados, os sete placements desktop (hero pelo teclado) e o mobile em 390×844 resultaram em oito eventos e oito chamadas legadas específicas Cative. Em nova página com Cative desativada: só GTM Izi selecionado, um evento hero e nenhuma chamada Meta legada, com campanha preservada no href. Reativação em nova página: um evento e uma chamada legada. Nenhum erro de página observado. Isso valida a lógica e a interface local; não executa os templates GTM reais nem comprova coleta.

Pendentes para concluir: configurar/publicar e testar os GTMs; conferir rede/Tag Assistant, GA4 DebugView e Meta Test Events; confirmar sessão da Cerro Corá no Clarity Izi e preservação Cative; verificar contagem real GA4 Cative; resolver coleta simultânea Clarity; inventariar dependências AWS em runtime; executar navegação desktop/mobile/teclado e testes com bases reais tardias; comprovar retirada/reativação de todos os destinos em novas sessões. Conversões Ads/labels, lead/D1 e compra/atribuição Pacto não foram validados.

Publicação do Hoster continua separada: PR, revisão e autorização explícita; o release antigo de 08/10 não autoriza esses novos hashes. Não foi criado bypass nem executado deploy/preflight de promoção live. A entrega de código não deve ser descrita como coleta Izi completa em produção.
