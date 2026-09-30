# Jumper Hoster

O `jumper-hoster` é o hub oficial de desenvolvimento dos sites criados pelo Jumper Site Factory.

- Hub: `https://site.jumper.dev.br/`
- Worker: `jumper-hoster`
- Endereço de cada cliente: `https://site.jumper.dev.br/[slug]/`
- Registro oficial: `jumper-hoster.registry.json`
- Acesso: o painel raiz é restrito à equipe Jumper; as rotas dos clientes são públicas.

## Nomes e fontes de verdade

- **`jumper-web`** é este repositório. Contém o construtor, o registro `jumper-hoster.registry.json`, o template do hub e o código do Worker `jumper-hoster`.
- **`jumper-hoster`** é o nome do Worker da Cloudflare que serve `site.jumper.dev.br`. Não é um repositório separado. O mesmo Worker também atende domínios oficiais configurados em `clientes/rodeio-restaurante/wrangler.jsonc`.
- **`jumper-site`** é outro repositório (`jumper-lab/jumper-site`), origem do site institucional `jumper.studio`. Sua prévia existente é `jumpersite.vercel.app`. O card no hub contém links; o site institucional não deve ser copiado nem implantado pelo `jumper-hoster` sem um projeto específico para isso.
- **IZI Gym institucional** tem seu código-fonte importado em `clientes/izigym-site/`; o histórico do antigo `jumper-lab/izigym` foi preservado na tag `izigym-source-import-0c1b3b8` deste repositório. A LP Cerro Corá permanece separada em `clientes/izigym-lp/`. Os snapshots de desenvolvimento e oficial usados pelo `jumper-hoster` continuam em `clientes/rodeio-restaurante/cloudflare/snapshots/`; importar ou editar o fonte não os atualiza automaticamente. O repositório antigo permanece disponível até a reconciliação e a troca controlada do processo de build.

## Estado exibido no hub

O painel consulta os commits atuais de `main` em `jumper-web` e `jumper-site`, além do último GitHub Deployment `Production` do `jumper-site` (Vercel), por uma rota autenticada de leitura. A versão ativa do `jumper-hoster` vem do binding nativo `CF_VERSION_METADATA`; os deploys feitos por `npm run deploy:cloudflare` recebem a tag `git-<SHA completo do main>`. Só há indicação de correspondência quando a tag ativa e o SHA atual de `jumper-web` são iguais; para o site institucional, compara-se o SHA do `main` com o último deployment de produção marcado `success`. Sem tag, sem GitHub, sem deployment válido ou com SHAs diferentes, o estado é **não comprovado/diferente**, nunca “sincronizado” por suposição. A correspondência Vercel/GitHub não substitui a checagem de DNS e da resposta real de `jumper.studio`.

O painel não lê chats do Codex diretamente: as decisões dos chats devem chegar a uma PR integrada, e o código aprovado deve ser publicado antes de representar uma mudança como ativa. A consulta de estado não modifica assets, D1, Worker, GitHub nem o site institucional. Os cards continuam vindo do registro versionado e precisam de PR + deploy controlado quando sua estrutura mudar.

## Regra obrigatória

Todo site concluído pelo construtor deve ser publicado neste Worker. Uma entrega só está completa quando:

1. o build usa `SITE_URL=https://site.jumper.dev.br` e base `/<slug>`;
2. o cliente e o site em desenvolvimento estão registrados em `jumper-hoster.registry.json`;
3. existe um card do cliente no painel raiz, com links separados para cada versão em desenvolvimento e para o site oficial, quando existir;
4. a rota pública `/<slug>/` e suas páginas internas respondem sem a senha do painel;
5. links, imagens, fontes, vídeos, canonical, Open Graph, sitemap e robots foram verificados no endereço do hub.

O `jumper-hoster` é o único Worker de hospedagem do construtor. Não crie um Worker separado por cliente. Domínios oficiais, quando gerenciados pela Jumper, devem ser adicionados como rotas do `jumper-hoster`, que seleciona os arquivos corretos pelo domínio ou pelo slug.

O registro e o painel devem permanecer sincronizados. O painel é gerado a partir do registro central e agrupa todas as versões pelo cliente. O campo `officialSite` pode ser `null` enquanto o cliente não tiver site em produção. A preparação do pacote falha se uma versão registrada não tiver arquivo inicial publicado ou se suas URLs não seguirem o padrão definido.

## Projetos atuais

- Rodeio: desenvolvimento em `/rodeio/` e oficial em `https://rodeiosp.com.br/`
- IZI Gym: desenvolvimento em `/izigym/` e oficial em `https://www.izigym.com.br/`, ambos servidos pelo `jumper-hoster`
- Casa Beliê: desenvolvimentos em `/casabelie/`, `/casabelie-2/` e `/casabelie-3/`, e oficial em `https://casabelie.com.br/`

Vercel pode ser usada somente quando houver pedido explícito. Ela não é origem, proxy ou etapa obrigatória do fluxo padrão.

## Publicação segura — GitHub primeiro, Cloudflare depois

### Cópia inicial do Worker de desenvolvimento

`clientes/rodeio-restaurante/wrangler.dev.jsonc` prepara o Worker
`jumper-hoster-dev` com o pacote de assets do Hoster e uma entrada que delega
ao mesmo Worker apenas nos sete caminhos dev, mas sem
rotas públicas, acesso `workers.dev`, D1, KV ou limitador de produção. A
configuração é verificada por `npm run verify:dev-config`; os caminhos são
testados por `npm run test:dev-worker`. A resposta dev recebe
`X-Jumper-Worker: jumper-hoster-dev` para confirmar o roteamento. A cópia inicial foi
comparada com a versão ativa `6c97d499-c969-43eb-8ec8-d3502bb622ad` do
`jumper-hoster`; os documentos protegidos passaram no preflight. Esse teste
não garante equivalência de todos os assets nem autoriza transferir tráfego.
Enquanto `routes` estiver vazio, **todos os links continuam no Worker original**.
Ativar qualquer caminho de desenvolvimento exige uma PR separada, teste do
conteúdo e das chamadas de rede, sem capturar hub, domínios oficiais ou APIs
de rastreamento. Nenhum deploy do Worker de produção é necessário para criar
o Worker dev.

1. Faça os ajustes em uma branch local isolada, valide-os e abra uma PR para `main` no GitHub.
2. Após o merge, use um checkout **limpo e atualizado de `main`**. Um merge não publica o hub. Não há workflow de GitHub Actions que faça o deploy do `jumper-hoster`.
3. Prepare o pacote completo com `npm run build:cloudflare` em `clientes/rodeio-restaurante`. Esse build inclui as outras páginas do Worker; não existe deploy de um único card pelo Wrangler.
4. Execute `npm run preflight:cloudflare` com `CLOUDFLARE_API_TOKEN` no ambiente. O preflight bloqueia um checkout fora de `main`, diferente do GitHub, com alterações rastreadas ou com páginas protegidas diferentes das versões atualmente publicadas. Também compara os domínios ativos com o `wrangler.jsonc`, verifica recursos críticos do Worker e detecta se a versão ativa mudou durante a auditoria.
5. Somente com preflight aprovado execute `npm run deploy:cloudflare`, que reconstrói o pacote, repete o preflight e então roda a versão de Wrangler fixada no `package-lock.json`. Depois confira o hub, as rotas de desenvolvimento e os domínios oficiais. Registre o ID da versão publicada para permitir rollback.

O token deve ficar em variável de ambiente local ou gerenciador de segredos, nunca em Git. Se o preflight falhar, **não rode `wrangler deploy` diretamente para contorná-lo**: reconcilie o conteúdo publicado com o GitHub em PR específica ou isole explicitamente o projeto que será alterado. A verificação de páginas iniciais e recursos críticos reduz o risco, mas não substitui revisão do diff nem uma checagem funcional pós-deploy.

### Reconciliação de 29/09/2026

A primeira auditoria encontrou recursos de Cerro Corá, leads IZI e briefing que faltavam no `main`. A PR #37 integrou esses recursos ao GitHub. Um novo build do `main` passou no preflight contra a versão Cloudflare `282b6913-c6de-4b31-af96-128b007ecd99`: todas as páginas iniciais protegidas e os domínios conferiram. Esse resultado é uma fotografia datada; qualquer novo deploy, commit ou mudança de assets exige reconstrução e nova auditoria antes da publicação.
