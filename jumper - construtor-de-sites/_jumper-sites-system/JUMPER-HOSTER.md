# Jumper Hoster

O Jumper Hoster reúne o hub e os sites criados pelo Jumper Site Factory. O Worker live (`jumper-hoster`) e o Worker de desenvolvimento (`jumper-hoster-dev`) dividem caminhos específicos do domínio técnico sem mudar os links existentes.

- Hub: `https://site.jumper.dev.br/`
- Worker: `jumper-hoster`
- Endereço de cada cliente: `https://site.jumper.dev.br/[slug]/`
- Registro oficial: `jumper-hoster.registry.json`
- Acesso: o painel raiz é restrito à equipe Jumper; as rotas dos clientes são públicas.

## Nomes e fontes de verdade

- **`jumper-web`** é este repositório. Contém o construtor, o registro `jumper-hoster.registry.json`, o template do hub e o código do Worker `jumper-hoster`.
- **`jumper-hoster`** é o Worker live da Cloudflare: serve a raiz e as áreas compartilhadas de `site.jumper.dev.br`, além dos domínios oficiais configurados em `clientes/rodeio-restaurante/wrangler.jsonc`. Não é um repositório separado.
- **`jumper-hoster-dev`** é o Worker separado que serve somente os caminhos dev explicitamente listados em `clientes/rodeio-restaurante/wrangler.dev.jsonc`. Também usa código do `jumper-web`, mas não publica o hub nem os oficiais.
- **`jumper-site`** é outro repositório (`jumper-lab/jumper-site`), origem do site institucional `jumper.studio`. Sua prévia existente é `jumpersite.vercel.app`. O card no hub contém links; o site institucional não deve ser copiado nem implantado pelo `jumper-hoster` sem um projeto específico para isso.
- **IZI Gym institucional** tem seu código-fonte importado em `clientes/izigym-site/`; o histórico do antigo `jumper-lab/izigym` foi preservado na tag `izigym-source-import-0c1b3b8` deste repositório. A LP Cerro Corá permanece separada em `clientes/izigym-lp/`. Os snapshots de desenvolvimento e oficial usados pelo `jumper-hoster` continuam em `clientes/rodeio-restaurante/cloudflare/snapshots/`; importar ou editar o fonte não os atualiza automaticamente. O repositório antigo permanece disponível até a reconciliação e a troca controlada do processo de build.

## Estado exibido no hub

O painel consulta os commits atuais de `main` em `jumper-web` e `jumper-site`, além do último GitHub Deployment `Production` do `jumper-site` (Vercel), por uma rota autenticada de leitura. A versão ativa do `jumper-hoster` vem do binding nativo `CF_VERSION_METADATA`; os deploys feitos por `npm run deploy:cloudflare` recebem a tag `git-<SHA completo do main>`. Só há indicação de correspondência quando a tag ativa e o SHA atual de `jumper-web` são iguais; para o site institucional, compara-se o SHA do `main` com o último deployment de produção marcado `success`. Sem tag, sem GitHub, sem deployment válido ou com SHAs diferentes, o estado é **não comprovado/diferente**, nunca “sincronizado” por suposição. A correspondência Vercel/GitHub não substitui a checagem de DNS e da resposta real de `jumper.studio`.

**Processos em andamento.** A Sala de Máquinas distingue diferença de versões de trabalho realmente ativo. Quando configurados, webhooks `workflow_run` assinados dos repositórios `jumper-web` e `jumper-site` registram início/fim das execuções no KV exclusivo `JUMPER_HUB_OPERATIONS`; sem a permissão GitHub `admin:repo_hook` e o segredo `JUMPER_HUB_GITHUB_WEBHOOK_SECRET`, a lista de processos informa que essas execuções não são monitoradas, sem inventar um estado de execução nem marcar como falha as fontes que estão funcionando; a publicação de produção da Vercel continua sendo conferida pela leitura do GitHub Deployment a cada 60 segundos. Um endpoint separado, protegido pela senha do hub, consulta os processos registrados a cada 10 segundos. Os comandos `npm run deploy:cloudflare`, `npm run deploy:dev -- --allow=<slug>` e `npm run deploy:dev:worker` criam marcadores temporários das fases dos deploys diretos de `jumper-hoster` e `jumper-hoster-dev`, atualizam-nos durante o processo e removem-nos ao terminar; se um processo travar, o registro expira após 180 segundos sem atualização. Eventos do GitHub, depois de habilitados, são aceitos somente após verificar a assinatura HMAC do segredo do webhook e expiram após 30 minutos caso o evento de conclusão não chegue. O hub apenas **lê** esses sinais e não inicia deploys, não altera sites e não usa IA para atualizar. Uma fonte monitorada indisponível aparece como verificação parcial, nunca como confirmação de que não há trabalho. Comandos `wrangler deploy` executados fora do fluxo, trabalhos ainda locais e PRs apenas abertas não são apresentados como processos ativos; seus eventos concluídos podem continuar nas últimas movimentações. O registro KV contém somente origem, fase, horário, SHA e URL de execução, sem senhas ou dados de clientes.

O painel não lê chats do Codex diretamente: as decisões dos chats devem chegar a uma PR integrada, e o código aprovado deve ser publicado antes de representar uma mudança como ativa. A consulta de estado não modifica assets, D1, Worker, GitHub nem o site institucional. Os cards continuam vindo do registro versionado e precisam de PR + deploy controlado quando sua estrutura mudar.

## Regra operacional e função deste manual

As instruções obrigatórias para agentes estão exclusivamente em [`AGENTS.md`](AGENTS.md#publicação-de-sites-pelo-jumper-hoster). Este arquivo explica a arquitetura, os comandos, as verificações e como investigar uma falha. Ele não é uma segunda fonte de regras. O painel é gerado de `jumper-hoster.registry.json`, que agrupa as versões por cliente; `officialSite` pode ser `null` até existir um site oficial.

O **menu conversacional do construtor** é mostrado no chat quando solicitado. O **formulário de briefing** em `/briefing/` recolhe as informações do cliente; o **site construído** é outra entrega. O primeiro endereço publicado desse site é sua rota de desenvolvimento `/<slug>/` no `jumper-hoster-dev`, não o hub nem o domínio oficial.

## Projetos atuais

- Pão de Queijo Haddock Lobo: desenvolvimento em `/pao-de-queijo-haddock-lobo/` no `jumper-hoster-dev` e site oficial externo em `https://paodequeijohaddocklobo.com.br/`. O formulário de contato do preview aguarda configuração de envio.
- Rodeio: desenvolvimento em `/rodeio/` e oficial em `https://rodeiosp.com.br/`
- IZI Gym: desenvolvimento em `/izigym/` no `jumper-hoster-dev` e oficial em `https://www.izigym.com.br/` no `jumper-hoster`
- Casa Beliê: desenvolvimentos em `/casabelie/`, `/casabelie-2/` e `/casabelie-3/`, e oficial em `https://casabelie.com.br/`
- LP IZI Gym: prévias `/izigym-lp/` (v1) e `/izigym-lp-vilaromana/` (v2 atual); oficial `https://cerrocora.izigym.com.br/`. A LP não é o site institucional `/izigym/`.

Os oficiais do Rodeio e da Casa Beliê usam hospedagens próprias, fora deste Worker. O `jumper-hoster` live atende o oficial IZI Gym, a LP Cerro Corá, o hub, o formulário e serviços compartilhados. Um link no card do hub não concede ao Hoster autoridade para publicar no site oficial externo.

Vercel pode ser usada somente quando houver pedido explícito. Ela não é origem, proxy ou etapa obrigatória do fluxo padrão.

## Separação atual: um domínio, dois Workers

| Endereço | Worker | Papel |
|---|---|---|
| `https://site.jumper.dev.br/` | `jumper-hoster` | Hub live, protegido por sessão |
| `https://site.jumper.dev.br/briefing/` | `jumper-hoster` | Formulário público live e seus assets |
| `https://site.jumper.dev.br/briefing/api/briefings` | `jumper-hoster` | Encaminha a submissão ao backend existente; não é um endpoint de teste |
| `https://site.jumper.dev.br/<slug>/` | `jumper-hoster-dev` | Site de cliente em desenvolvimento, nos oito slugs declarados |
| `https://www.izigym.com.br/` e `https://cerrocora.izigym.com.br/` | `jumper-hoster` | Publicações oficiais distintas |

As rotas específicas `site.jumper.dev.br/<slug>/*` têm precedência sobre o custom domain do Worker live. `wrangler.dev.jsonc` e `cloudflare/dev-worker.mjs` enumeram exatamente os oito slugs; qualquer outro caminho no Worker dev devolve 404. Não há `workers.dev`, D1, KV, limitador ou segredo de produção no dev. O cabeçalho `X-Jumper-Worker: jumper-hoster-dev` confirma qual Worker entregou um caminho dev. A API `/api/izigym/leads` e os caminhos de autenticação continuam no live; o Worker dev não os captura. Não remova nem redirecione essas APIs sem revisar o rastreamento e os cadastros.

**Ainda não há link dev ativo do hub ou do formulário.** `site-dev.jumper.dev.br` é apenas um hostname técnico proposto para a futura prévia **do hub**, não um endereço do briefing nem um link a enviar ao cliente. Ele não consta em `wrangler.dev.jsonc` e não foi publicado. Para ativá-lo, será preciso criar uma aplicação Cloudflare Access nesse host com a política existente “Time Jumper” (qualquer e-mail `@jumper.studio`) e configurar no Worker dev a audiência dessa aplicação em `HOSTER_DEV_ACCESS_AUD`, **além de configurar sua própria cópia do segredo `JUMPER_HUB_PASSWORD`**. O Worker exige JWT assinado, audiência, expiração e domínio de e-mail; sem Access devolve 404, e sem a senha do hub não entrega o painel. A credencial Cloudflare de linha de comando atual não administra Access. A sala de máquinas do hub não consulta o estado live nessa prévia.

**O briefing para clientes permanece público em `https://site.jumper.dev.br/briefing/`, sem senha nem login.** O código de prévia interna do hub não serve `/briefing/`. Uma futura prévia do formulário, se necessária, deverá ter endereço distinto, continuar simples de abrir e enviar respostas somente a um backend de teste isolado ou deixar o envio desativado de forma explícita. Nunca troque o link público nem faça uma resposta de teste entrar no Notion de produção. O formulário não é o site gerado pelo construtor.

### Senhas: hub e prévias de clientes são independentes

O hub live em `/` sempre apresenta sua própria tela de senha. `JUMPER_HUB_PASSWORD` é o segredo exclusivo do hub e de `/__jumper/system-status`; `JUMPER_HOSTER_PASSWORD` continua protegendo os painéis e testes administrativos existentes. Cada área usa um cookie distinto. Na transição, enquanto `JUMPER_HUB_PASSWORD` não estiver configurado, o hub continua usando a credencial administrativa anterior para não ficar aberto nem inacessível durante o deploy. Configure o novo segredo e teste login, status e logout antes de considerar a separação concluída. O valor da senha nunca entra no GitHub, no manual, no código, no histórico de comandos ou no corpo da PR. O link do briefing e as páginas públicas de clientes não passam por esse login.

Os oito sites dev continuam **públicos por padrão**. Uma prévia confidencial só é protegida quando o usuário definir uma senha e um slug específicos. O Worker dev procura um segredo individual `HOSTER_DEV_PASSWORD_<SLUG>` (hífens viram sublinhados; por exemplo, `izigym-lp` usa `HOSTER_DEV_PASSWORD_IZIGYM_LP`). Se ele não existir, aquele site continua público. Se existir, o Worker exige a senha para HTML **e assets** sob `/<slug>/`, em uma página de login com identidade Jumper; a sessão dura sete dias e é vinculada ao host e slug. Segredos vazios ou com menos de 12 caracteres falham fechados com HTTP 503. Trocar a senha invalida a sessão anterior daquele site. Nenhuma senha de prévia é colocada em URL, card do hub ou repositório. `/izigym/` e `/izigym-lp/` são independentes; nenhum domínio oficial é protegido por esse mecanismo.

Para permitir o preflight de outros clientes quando uma prévia estiver protegida, configure também `HOSTER_DEV_AUDIT_TOKEN` no Worker dev e na execução local da auditoria. O preflight usa esse token **somente em GET dos assets no mesmo host**, sem seguir redirecionamentos; se faltar ou não corresponder, a comparação recebe 401 e o deploy é bloqueado. O token não abre o hub, o briefing, APIs ou domínios oficiais. Guarde-o em um cofre de segredos, nunca em Git. Antes de ativar uma senha de cliente, configure proteção contra tentativas repetidas no Cloudflare para a rota de login e escolha com o usuário uma senha forte. O Codex não deve gerar, escolher ou publicar a senha por conta própria.

`wrangler secret put` **cria e publica imediatamente** uma nova versão do Worker. Para uma senha solicitada, confira o Worker e o slug, revise o estado dev e o preflight, crie uma versão não ativa com `wrangler versions secret put` e só promova a versão após conferir exatamente o que ela contém e obter autorização de publicação. Repita as verificações das outras rotas após a promoção. Se houver qualquer diferença, não promova. Não use esse processo para `jumper-hoster` live por engano; o segredo do hub exige o procedimento live separado descrito abaixo.

## Fluxo de um site no dev

1. Parta de uma branch isolada do `main`. Para um site novo, crie o fonte, registre o cliente no `jumper-hoster.registry.json` e proponha uma rota específica no `dev-worker.mjs` e no `wrangler.dev.jsonc`; nenhum endereço oficial é criado automaticamente. Para um site existente, identifique exatamente o slug a alterar.
2. Faça o build local do pacote completo em `clientes/rodeio-restaurante` com `npm run build:cloudflare`. Confira HTML, assets, links internos, recursos externos, formulários e rastreamento do site alvo. O build inclui os **outros sites, o hub, o briefing e versões oficiais**; gerar o pacote não publica nada.
3. Se arquivos foram acrescentados ou removidos no slug alvo, rode `npm run inventory:dev -- --allow=<slug>` e revise a diferença em `config/dev-site-inventory.json`. Esse inventário registra caminhos, não dados de clientes nem segredos; atualizar um slug não libera outro. Rode `npm run verify:dev-config`, `npm run test:dev-worker` e `npm run test:dev-preflight`. Abra uma PR contra `main`, publique a branch no GitHub e revise o diff. O preflight de publicação exige branch limpa e idêntica à sua branch remota; ele não aceita `main` nem um slug genérico `all`.
4. Antes de qualquer upload, rode `npm run preflight:dev -- --allow=<slug>`. O script exige que a branch contenha o `main` atual, confere que **o inventário dos outros clientes não mudou em relação ao `main`** e compara o inventário completo com o pacote, revelando inclusões/remoções não revisadas. Também compara **todos os arquivos candidatos das outras sete rotas dev** com as URLs atualmente publicadas e confere que hub, briefing, APIs e oficiais ainda respondem pelo live. Conteúdo diferente, ausência, erro de rede, outro Worker ou mudança concorrente de versão bloqueiam o deploy. Não há publicação nesta etapa.
5. Somente com autorização de deploy dev, rode `npm run deploy:dev -- --allow=<slug>`. O comando refaz o build e o preflight e publica **somente** `jumper-hoster-dev` com `wrangler.dev.jsonc`. Depois compara novamente as respostas das áreas live; se elas mudarem, reporta incidente — o upload já ocorreu e requer investigação imediata, não uma falsa indicação de que foi revertido. Confira também a rota alterada, as outras rotas e a identidade do Worker. Registre o commit e o Version ID para uma eventual reversão.
6. Revise o resultado no dev, integre a PR em `main` e trate a publicação oficial como operação **separada**. Merge não publica o Hoster. Domínios de clientes fora do Hoster usam seus próprios fluxos, nunca este comando.

Exemplo: uma alteração em `/izigym-lp-vilaromana/` usa `--allow=izigym-lp-vilaromana`. A rota `/izigym-lp/` continua protegida, mesmo sendo da mesma marca. O oficial Cerro Corá não é alterado por um deploy dev. Se o build tocar também a v1, a conferência bloqueia a publicação; é necessário decidir e revisar explicitamente o escopo, não liberar ambas por conveniência.

Para mudar **somente o código compartilhado** do Worker dev, sem alterar nenhum cliente, integre primeiro a PR em `main` e trabalhe em um checkout limpo desse commit. Rode `npm run build:cloudflare`, `npm run preflight:dev:worker` e, após conferir o resultado e obter autorização, `npm run deploy:dev:worker`. Esse modo compara o inventário e o conteúdo publicado de **todos os oito** sites dev, sem slug liberado; também verifica as fronteiras live e a versão do Worker antes do upload. Uma diferença bloqueia. Ele não publica o Worker live, não ativa senha por cliente e não muda os links.

### Quando o preflight bloquear

O arquivo **ainda não foi publicado**. Leia o caminho apontado no erro, compare o pacote local, a URL dev publicada e as alterações recentes no GitHub/outros trabalhos em andamento. Se a mudança é de outro cliente, preserve a versão correta no fonte antes de refazer o build. Se é um segundo ajuste intencional, separe-o em outra revisão e outro deploy de escopo explícito. Nunca substitua o dev pelo oficial ou faça `wrangler deploy` diretamente para passar por cima do bloqueio. Se não houver evidência para escolher a versão correta, pare e peça uma decisão.

O inventário detecta inclusões e remoções no pacote, e o preflight compara bytes dos arquivos candidatos das sete pastas não autorizadas com a publicação. Ele não consulta um inventário remoto completo da Cloudflare: uma publicação externa não registrada no GitHub exige reconciliação adicional. Tampouco valida conversão ou funcionamento de APIs; revisão do diff e testes funcionais continuam necessários. Portanto, não há promessa de “risco zero”. A entrada do Worker e a lista de rotas são testadas separadamente para manter hub, briefing e domínios oficiais fora do dev.

## Publicação live

O live continua em `jumper-hoster` e **não** é publicado pelo GitHub Actions. Uma solicitação de publicar no dev não autoriza publicar no live. Para uma publicação live explicitamente aprovada, use um checkout limpo de `main`, `npm run build:cloudflare`, `npm run preflight:cloudflare` e somente então `npm run deploy:cloudflare`; o próprio comando repete a auditoria. O preflight live compara páginas protegidas, domínios, vínculos D1 e funções críticas com o Worker atualmente ativo. O pacote é compartilhado, portanto uma alteração pretendida de página protegida não deve ser liberada por um bypass: precisa de uma revisão de escopo e de uma estratégia de promoção específica antes do deploy.

**Promoção Cerro Corá de 08/10/2026.** A publicação explicitamente solicitada para checkout direto usa `npm run deploy:cloudflare -- --promote=cerrocora-direct-checkout-2026-10-08`, após PR e merge. O registro versionado em `clientes/rodeio-restaurante/data/releases/cerrocora-direct-checkout-2026-10-08.json` fixa hashes do HTML anterior e candidato da Cerro Corá e do pacote Vila Romana, além do código compartilhado do Worker. A prévia Vila Romana no Worker dev pode continuar com seu HTML anterior; esse estado é conferido pelo hash registrado e não é publicado pelo comando live. Todos os demais sites continuam na comparação estrita. Hash diferente, revisão antiga, checkout sujo ou deploy concorrente bloqueia a promoção. A opção não concede autorização para mudanças em outro cliente e não é uma liberação genérica de diferenças.

Após o deploy, confira o hub e a autenticação, o formulário e sua API, os sites oficiais e os cadastros/rastreamento afetados. Para Rodeio ou Casa Beliê oficiais, esta operação **não** publica seus domínios externos. Segredos ficam em variável de ambiente ou gerenciador próprio, nunca em Git ou na documentação.

### Reconciliação de 29/09/2026

A primeira auditoria encontrou recursos de Cerro Corá, leads IZI e briefing que faltavam no `main`. A PR #37 integrou esses recursos ao GitHub. Um novo build do `main` passou no preflight contra a versão Cloudflare `282b6913-c6de-4b31-af96-128b007ecd99`: todas as páginas iniciais protegidas e os domínios conferiram. Esse resultado é uma fotografia datada; qualquer novo deploy, commit ou mudança de assets exige reconstrução e nova auditoria antes da publicação.

### Build dev com prévias IZI preservadas — 08/10/2026
A promoção oficial Cerro Corá da PR #100 alterou o fonte usado também pelas prévias IZI, sem publicar essas prévias. Para um deploy dev, monte o pacote com `npm run build:cloudflare:dev -- --allow=<slug>` (ou `--worker-only` no fluxo próprio). `deploy:dev` e `deploy:dev:worker` já selecionam esse build. Ele conserva os cinco arquivos públicos das prévias IZI anteriores em snapshots versionados com SHA-256; remove das prévias somente os dois assets novos reconhecidos por hash. Não restaura o Worker live nem os domínios oficiais. O build/promoção live continua em `build:cloudflare`.

O slug explicitamente autorizado não recebe a restauração de snapshot; uma edição futura de uma LP IZI deve atualizar somente seu inventário e passar no preflight correspondente. Snapshot alterado, build novo não reconhecido ou diferença contra a prévia publicada bloqueiam. Os outros sete sites e as fronteiras live continuam na comparação estrita; nenhuma diferença foi liberada. Após uma nova publicação dev da IZI, reconciliar seus snapshots por PR antes de outro deploy compartilhado.
