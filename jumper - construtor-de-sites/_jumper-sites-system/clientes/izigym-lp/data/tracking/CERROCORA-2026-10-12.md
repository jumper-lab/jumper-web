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

`placement` identifica `header`, `hero`, `gallery`, `manifesto`, `prime`, `one`, `footer` ou `mobile`. Campanha: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `gclid` e `fbclid`; extensões `utm_*` não pessoais continuam com os nomes existentes. São strings quando presentes; valores ausentes não são fabricados. A URL de telemetria conserva unidade, plano, cupom e campanha, sem chave de conta, credenciais ou fragmento. O link comercial permanece completo.

O complemento reforçou a proteção no caminho oficial: campos UTM pessoais conhecidos (contato, nome, documento, endereço e identificador de pessoa) e valores com formato de e-mail, telefone ou documento são omitidos tanto do payload quanto da URL de telemetria. Valores codificados também são examinados. Números de 10 a 14 dígitos em campos UTM livres são excluídos; `utm_id` continua aceitando identificadores numéricos de campanha. Os valores originais usados pela navegação não são modificados por esse filtro, nem o comportamento das prévias sem configuração oficial.

`cative_checkout_source` informa o caminho de envio Cative e permanece `legacy` nesta entrega. O modo `gtm` está preparado no código para uma etapa futura; não deve ser ativado antes de o responsável pelo container validar o substituto. Os controles de ativação e esse marcador são dados internos de controle. O código preserva mensagens existentes de consentimento e não acrescenta comandos de concessão.

O mesmo evento do site está disponível aos dois containers. O contrato registra o destino esperado Izi: GA4 `checkout_click` e Meta custom `checkout_click`, restritos à Cerro Corá. Esse mapeamento pertence à configuração GTM, fora desta PR. O marcador de origem não é enviado pela chamada Meta própria: seus únicos argumentos são `trackSingle`, pixel Cative e nome legado `InitiateCheckout`.

A página oficial atual não contém formulário funcional. Não foi acrescentado `lead_submit`, `begin_checkout` ou `purchase`. O clique mede saída para contratação; início real de checkout e compra dependem do ambiente Pacto. O nome Meta legado é preservado por compatibilidade, sem servir como evidência de início real de checkout.

## Observação anterior sobre Clarity — fora do escopo

A auditoria dos scripts públicos encontrou uma proteção contra segundo coletor: a execução controlada em ambas as ordens resultou em um `start` e um `dup.<projectId>`. A evidência está em [`2026-10-12/clarity-conflict.json`](2026-10-12/clarity-conflict.json). Nenhum snippet Clarity direto foi acrescentado ao site e nenhum GTM foi alterado. Configuração e validação de coleta Clarity pertencem aos responsáveis pelo GTM e não bloqueiam o aceite do código desta PR.

## Controles e retorno do código

Os dois kits são entregues ativos. Desligar somente Izi exige `izi.enabled=false`, novo build e nova página; desligar somente Cative usa `cative.enabled=false` nas mesmas condições. O emissor lógico `checkout_click` e a navegação continuam funcionando. Reativar um kit exige restaurar sua flag para `true`.

Para retornar ao comportamento anterior da página, restaurar a versão anterior do código e seguir o fluxo de publicação do Hoster. Para manter os dois carregadores com o caminho Cative atual, conservar `ga4Direct.enabled=true` e `metaCheckout.source=legacy`. Esta PR não muda versões dos containers.

## Evidências e limites

Os testes locais cobrem os oito placements, um push por ocorrência, repetição do setup, cliques rápidos, `pageshow`/campanha, armazenamento bloqueado/corrupto, URL sanitizada, fila existente, controles, exclusividade de origem e empacotamento que falha se os snippets anteriores não forem reconhecidos. O teste com Meta tardio comprova que navegação/evento lógico não bloqueiam; recebimento do legado ainda depende da biblioteca disponível no clique.

Executar a suíte após `npm run build`: `npm test` em `izigym-lp`. Os testes do Hoster verificam preservação das prévias e fronteiras de publicação. O manifesto das prévias conserva os mesmos snapshots de 08/10; somente hashes dos candidatos gerados precisam acompanhar o novo módulo. Os arquivos de snapshot não foram substituídos pelo oficial.

[`2026-10-12/tests-summary.json`](2026-10-12/tests-summary.json) registra o build completo da implementação inicial; após o complemento, novo build da LP e empacotamento Hoster aprovados, com 21 testes da LP e 25 testes do Hoster aprovados.

[`2026-10-12/datalayer-validation.json`](2026-10-12/datalayer-validation.json) contém os payloads sanitizados e as evidências do navegador local. Foram seis cenários: desktop 1440×900 e celular emulado 390×844, cada um em modo legado, Cative desligada e origem `gtm`. Em cada cenário, os oito placements, teclado e clique duplo produziram 11 eventos para 11 interações. No modo legado houve 11 chamadas específicas Cative; com Cative desligada ou origem `gtm`, nenhuma chamada Meta direta. Os sete CTAs visíveis de cada layout receberam cliques nativos; `mobile` escondido no desktop e `header` escondido no celular tiveram o handler conferido por despacho programático, identificado na evidência.

Quatro testes adicionais de navegação (clique e Enter, nos dois tamanhos) observaram um push antes da saída e preservação de destino, unidade, plano, chave, cupom e campanha. A saída usou um destino Pacto simulado. Fila anterior, inicialização compartilhada, refresh, retorno e exclusão dos dados pessoais de teste também foram conferidos. Nenhum erro de página foi observado.

A reativação Cative foi conferida nos dois tamanhos em uma nova página: um evento lógico e uma chamada legada, com ambos os carregadores GTM selecionados. A evidência inclui os argumentos interceptados: `trackSingle`, `922916223883872`, `InitiateCheckout`, sem parâmetros de controle internos.

Emissão observada nesta validação significa o push real da página e a chamada própria Meta interceptada por uma biblioteca simulada. A chamada legada é única por ocorrência e dirigida ao pixel Cative; em modo `gtm` ela fica desativada. Os scripts GTM/GA4 foram simulados, portanto os testes não executaram tags reais e não comprovam ausência de duplicação dentro dos containers nem recebimento GA4/Meta/Clarity. Recebimento confirmado nas plataformas: **não verificado**. O kit Izi foi validado aqui como carregador independente, sem depender da Cative para emitir o evento do site.

Uma segunda conferência está em [`2026-10-12/published-script-emissions.json`](2026-10-12/published-script-emissions.json): os scripts publicados foram lidos sem editar os containers, com o hostname oficial representado por HTML/assets locais e toda coleta interceptada, sem encaminhamento aos destinos reais. Nos modos legado e `gtm`, houve uma requisição GA4 `page_view` por ID ativo (`G-70NXMC0KR6` e `G-7CECXK1LS2`); com Cative desligada, somente `G-70NXMC0KR6`. A base Ads Izi também produziu tentativas de coleta. Cada cenário teve um clique hero e um evento lógico.

Os scripts Meta e suas configurações responderam 200 e a biblioteca ficou disponível, mas nenhuma requisição de coleta Meta foi observada na janela isolada de 15 segundos. Portanto a evidência Meta comprova a chamada própria dirigida ao pixel Cative nos testes determinísticos, sem comprovar transporte ou recebimento. `checkout_click` GA4 Izi também não foi observado como requisição nessa sessão. A conferência não valida o futuro mapeamento das tags, nem autoriza retirar legados. Respostas de coleta simuladas podem provocar retentativas auxiliares (incluindo Clarity), que não devem ser contadas como eventos lógicos duplicados. Nenhum recebimento nas plataformas foi declarado.

A entrega de código está pronta para revisão no escopo de instalação e `dataLayer`. Configuração de tags, recebimento nas plataformas, migração dos legados Cative, dependências AWS, conversões Ads, lead/D1 e compra/atribuição Pacto ficam fora desta entrega.

Publicação do Hoster continua separada: PR, revisão e autorização explícita; o release antigo de 08/10 não autoriza esses novos hashes. Não foi criado bypass nem executado deploy/preflight de promoção live. Merge atualiza o repositório; o site publicado só muda após deploy.
