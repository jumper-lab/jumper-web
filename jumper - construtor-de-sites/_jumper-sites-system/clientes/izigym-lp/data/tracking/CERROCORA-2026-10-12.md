# Cerro Corá — instalação de rastreamentos e contrato dataLayer

Briefing aplicado: `jumper-tracker/clients/izigym/PLANO-PARIDADE-PRINCIPAL-CERROCORA.md`, atualizado em 12/10/2026, com o escopo esclarecido pelo usuário: instalar os rastreamentos no código da página e montar o `dataLayer`, somente no oficial Cerro Corá. A implementação e a validação local desse escopo estão concluídas. A publicação do site é uma etapa separada.

Configurar, editar ou publicar tags, gatilhos, variáveis e versões dos GTMs fica fora desta entrega. O recebimento nas plataformas e uma futura migração dos legados Cative também pertencem a outras etapas; não são requisitos pendentes desta PR.

## Configuração entregue

`data/cerrocora-tracking.json` centraliza `izi.enabled` e `cative.enabled`, ambos `true`, e os dois IDs GTM. O Hoster aplica essa configuração somente ao HTML `hoster-dist/cerrocora/index.html`. Nenhuma ferramenta Izi é instalada diretamente; os destinos ficam no respectivo GTM.

O bootstrap preserva a fila existente, publica os controles sem criar um novo evento custom, carrega cada container uma vez e compartilha um único `gtm.js`. O handler existente dos oito links continua emitindo um único `checkout_click`. `site_id`, os controles e `cative_checkout_source` ficam no mesmo push. O evento preserva campanha e destino, retirando da URL de telemetria a chave `k`, credenciais, fragmento e parâmetros alheios. O href comercial mantém unidade, plano, chave e cupom originais. `utm_*`, `gclid` e `fbclid` continuam com os valores existentes; nenhum preço/valor/receita foi acrescentado.

Os legados Cative permanecem ativos: `cative.legacy.ga4Direct.enabled = true` e `cative.legacy.metaCheckout.source = legacy`. O `InitiateCheckout` direto agora usa `trackSingle` para `922916223883872` exclusivamente, evitando que a chamada da página alcance o pixel Izi. Uma futura retirada desses legados exige outra alteração, após validação dos substitutos pelos responsáveis pelo GTM.

Para desligar Cative em teste, alterar somente `cative.enabled` para `false`, reconstruir e abrir uma nova página/sessão. Nenhum GTM, GA4 direto ou chamada Meta Cative será iniciado por esse código; tags exclusivamente no container também deixam de carregar. Não existe controle por query string nem tentativa de descarregar um container já executado. Reativar requer `true`, novo build e nova sessão.

## Auditoria anterior

[`2026-10-12/inventory-before.json`](2026-10-12/inventory-before.json) registra URLs, hashes e versões da coleta pública realizada antes das mudanças:

- Izi publicado v23: Google tag GA4 7, base Ads 8, Meta PageView 15. Não havia mapeamento `checkout_click` nem novo Clarity. As regras de checkout/venda existentes da LP/Pacto não foram alteradas.
- Cative publicado v10: Google tag GA4 27, Meta variável 20, Clarity 23. A tag GA4 tem o mesmo ID do bootstrap direto. Isso comprova duas configurações, sem comprovar dupla contagem.
- Os runtimes dos templates Meta de ambos contêm `trackSingle`/`trackSingleCustom`. O broadcast próprio da página foi isolado no caminho oficial.
- Na sessão Chrome disponível, o container Izi aparecia na conta Izi GYM - Holding, sem alterações pendentes. O container Cative não apareceu na lista acessível; a coleta de sua versão foi pública. Não houve edição/publicação em nenhum GTM.
- Não foi encontrado endpoint AWS no fonte próprio ou recursos publicados dos containers inspecionados. A dependência de configurações carregadas pelo pixel/rede ainda precisa de inventário em runtime; ausência nesses arquivos não comprova ausência de requisições. Nenhuma integração foi copiada.

## Contrato dataLayer entregue

[`datalayer-contract.json`](datalayer-contract.json) documenta as mensagens produzidas pela página e um exemplo sanitizado. É uma referência do código implementado; não aplica configuração aos GTMs.

| Mensagem | Campos | Emissão |
|---|---|---|
| Contexto da página | `site_id`, `izi_enabled`, `cative_enabled` | Uma vez, preservando a fila existente; sem evento custom. |
| Inicialização GTM | `event=gtm.js`, `gtm.start` | Uma inicialização compartilhada pelos containers ativos; não repete se a fila já contém esse evento. |
| Contratação | `event=checkout_click`, `placement`, `checkout_url`, `site_id`, `izi_enabled`, `cative_enabled`, `cative_checkout_source` e campanha disponível | Um push por interação, com contexto e parâmetros na mesma mensagem. |

`placement` identifica `header`, `hero`, `gallery`, `manifesto`, `prime`, `one`, `footer` ou `mobile`. Os parâmetros `utm_*`, `gclid` e `fbclid` são strings quando presentes; valores ausentes não são fabricados. A URL de telemetria conserva unidade, plano, cupom e campanha, sem chave de conta, credenciais ou fragmento. O link comercial permanece completo.

`cative_checkout_source` informa o caminho de envio Cative e permanece `legacy` nesta entrega. O modo `gtm` está preparado no código para uma etapa futura; não deve ser ativado antes de o responsável pelo container validar o substituto. Os controles de ativação e esse marcador são dados internos de controle. O código preserva mensagens existentes de consentimento e não acrescenta comandos de concessão.

## Observação anterior sobre Clarity — fora do escopo

A auditoria dos scripts públicos encontrou uma proteção contra segundo coletor: a execução controlada em ambas as ordens resultou em um `start` e um `dup.<projectId>`. A evidência está em [`2026-10-12/clarity-conflict.json`](2026-10-12/clarity-conflict.json). Nenhum snippet Clarity direto foi acrescentado ao site e nenhum GTM foi alterado. Configuração e validação de coleta Clarity pertencem aos responsáveis pelo GTM e não bloqueiam o aceite do código desta PR.

## Controles e retorno do código

Os dois kits são entregues ativos. Desligar somente Izi exige `izi.enabled=false`, novo build e nova página; desligar somente Cative usa `cative.enabled=false` nas mesmas condições. O emissor lógico `checkout_click` e a navegação continuam funcionando. Reativar um kit exige restaurar sua flag para `true`.

Para retornar ao comportamento anterior da página, restaurar a versão anterior do código e seguir o fluxo de publicação do Hoster. Para manter os dois carregadores com o caminho Cative atual, conservar `ga4Direct.enabled=true` e `metaCheckout.source=legacy`. Esta PR não muda versões dos containers.

## Evidências e limites

Os testes locais cobrem os oito placements, um push por ocorrência, repetição do setup, cliques rápidos, `pageshow`/campanha, armazenamento bloqueado/corrupto, URL sanitizada, fila existente, controles, exclusividade de origem e empacotamento que falha se os snippets anteriores não forem reconhecidos. O teste com Meta tardio comprova que navegação/evento lógico não bloqueiam; recebimento do legado ainda depende da biblioteca disponível no clique.

Executar a suíte após `npm run build`: `npm test` em `izigym-lp`. Os testes do Hoster verificam preservação das prévias e fronteiras de publicação. O manifesto das prévias conserva os mesmos snapshots de 08/10; somente hashes dos candidatos gerados precisam acompanhar o novo módulo. Os arquivos de snapshot não foram substituídos pelo oficial.

[`2026-10-12/tests-summary.json`](2026-10-12/tests-summary.json) registra build completo, 18 testes da LP e 25 testes do Hoster aprovados. Na conferência local Chrome, com destinos simulados, os sete placements desktop (hero pelo teclado) e o mobile em 390×844 resultaram em oito eventos e oito chamadas legadas específicas Cative. Em nova página com Cative desativada: só GTM Izi selecionado, um evento hero e nenhuma chamada Meta legada, com campanha preservada no href. Reativação em nova página: um evento e uma chamada legada. Nenhum erro de página observado. Isso valida a lógica e a interface local; não executa os templates GTM reais nem comprova coleta.

A entrega de código está pronta para revisão no escopo de instalação e `dataLayer`. Configuração de tags, recebimento nas plataformas, migração dos legados Cative, dependências AWS, conversões Ads, lead/D1 e compra/atribuição Pacto ficam fora desta entrega.

Publicação do Hoster continua separada: PR, revisão e autorização explícita; o release antigo de 08/10 não autoriza esses novos hashes. Não foi criado bypass nem executado deploy/preflight de promoção live. Merge atualiza o repositório; o site publicado só muda após deploy.
