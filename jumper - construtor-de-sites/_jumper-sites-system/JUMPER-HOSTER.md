# Jumper Hoster

O hub e os sites de desenvolvimento compartilham o endereço, mas não o pacote de publicação.

- Hub: `https://site.jumper.dev.br/`
- Worker do painel raiz: `jumper-hub` (rota exata `/` e assets em `/hub-assets/*`)
- Worker dos sites: `jumper-hoster` (continua como Custom Domain/origem de `site.jumper.dev.br`)
- Endereço de cada cliente: `https://site.jumper.dev.br/[slug]/`
- Registro oficial: `jumper-hoster.registry.json`
- Acesso: o painel raiz é restrito à equipe Jumper; as rotas dos clientes são públicas.

## Nomes e fontes de verdade

- **`jumper-web`** é este repositório. Contém o construtor, o registro `jumper-hoster.registry.json`, o template do hub e os dois Workers.
- **`jumper-hub`** publica somente o painel raiz e seus arquivos visuais. A rota específica da raiz tem precedência sobre o Custom Domain do `jumper-hoster`. O login e a sessão continuam sob responsabilidade do hoster, consultado internamente via Service Binding.
- **`jumper-hoster`** é a origem de `site.jumper.dev.br`, publica as rotas dos clientes e também atende os domínios oficiais configurados em `clientes/rodeio-restaurante/wrangler.jsonc`. Seu pacote não contém o HTML/CSS do hub.
- **`jumper-site`** é outro repositório (`jumper-lab/jumper-site`), origem do site institucional `jumper.studio`. Sua prévia existente é `jumpersite.vercel.app`. O card no hub contém links; o site institucional não deve ser copiado nem implantado pelo `jumper-hoster` sem um projeto específico para isso.
- **`izigym`** também tem repositório próprio (`jumper-lab/izigym`). Os snapshots usados pelo `jumper-hoster` ficam neste repositório, mas uma mudança no repositório da IZI não atualiza automaticamente os snapshots daqui.

## Estado exibido no hub

O painel consulta os commits atuais de `main` em `jumper-web` e `jumper-site`, além do último GitHub Deployment `Production` do `jumper-site` (Vercel), por uma rota autenticada de leitura. A versão ativa do `jumper-hoster` vem do binding nativo `CF_VERSION_METADATA`; seus deploys recebem a tag `git-<SHA completo do main>`. Quando o GitHub avançou após esse SHA, a comparação de arquivos só considera o hoster alinhado se **todas** as mudanças forem exclusivas do hub; mudanças em sites ficam como pendentes, e histórico divergente gera alerta. Falha na comparação fica não verificada. Para o site institucional, compara-se o SHA do `main` com o último deployment de produção marcado `success`. A correspondência Vercel/GitHub não substitui a checagem de DNS e da resposta real de `jumper.studio`.

O painel não lê chats do Codex diretamente: as decisões dos chats devem chegar a uma PR integrada, e o código aprovado deve ser publicado antes de representar uma mudança como ativa. A consulta de estado não modifica assets, D1, Worker, GitHub nem o site institucional. Os cards continuam vindo do registro versionado e precisam de PR + deploy controlado quando sua estrutura mudar.

## Regra obrigatória

Todo site concluído pelo construtor deve ser publicado neste Worker. Uma entrega só está completa quando:

1. o build usa `SITE_URL=https://site.jumper.dev.br` e base `/<slug>`;
2. o cliente e o site em desenvolvimento estão registrados em `jumper-hoster.registry.json`;
3. existe um card do cliente no painel raiz, gerado no pacote independente do hub a partir do registro, com links separados para cada versão em desenvolvimento e para o site oficial, quando existir;
4. a rota pública `/<slug>/` e suas páginas internas respondem sem a senha do painel;
5. links, imagens, fontes, vídeos, canonical, Open Graph, sitemap e robots foram verificados no endereço do hub.

O `jumper-hoster` continua sendo o único Worker de hospedagem dos **sites dos clientes**. Não crie um Worker separado por cliente. O `jumper-hub` não hospeda sites: publica apenas a vitrine. Domínios oficiais, quando gerenciados pela Jumper, devem ser adicionados como rotas do `jumper-hoster`, que seleciona os arquivos corretos pelo domínio ou pelo slug.

O registro e o painel devem permanecer sincronizados. O painel é gerado a partir do registro central e agrupa todas as versões pelo cliente. O campo `officialSite` pode ser `null` enquanto o cliente não tiver site em produção. A preparação do pacote falha se uma versão registrada não tiver arquivo inicial publicado ou se suas URLs não seguirem o padrão definido.

## Projetos atuais

- Rodeio: desenvolvimento em `/rodeio/` e oficial em `https://rodeiosp.com.br/`
- IZI Gym: desenvolvimento em `/izigym/` e oficial em `https://www.izigym.com.br/`, ambos servidos pelo `jumper-hoster`
- Casa Beliê: desenvolvimentos em `/casabelie/`, `/casabelie-2/` e `/casabelie-3/`, e oficial em `https://casabelie.com.br/`

Vercel pode ser usada somente quando houver pedido explícito. Ela não é origem, proxy ou etapa obrigatória do fluxo padrão.

## Publicação segura — GitHub primeiro, Cloudflare depois

1. Faça os ajustes em uma branch local isolada, valide-os e abra uma PR para `main` no GitHub.
2. Após o merge, use um checkout **limpo e atualizado de `main`**. Um merge não publica o hub. Não há workflow de GitHub Actions que faça o deploy do `jumper-hoster`.
3. Em `clientes/rodeio-restaurante`, publique primeiro o hub com `npm run deploy:hub`. O script monta somente `hub-dist`, verifica que o roteamento cobre apenas `/` e `/hub-assets/*`, confere o GitHub `main`, publica o `jumper-hub` e compara as páginas dos clientes antes/depois. O domínio do hoster não é removido.
4. Confira a raiz, o login, o CSS, a sala de máquinas e o acesso aos sites. Só então prepare os sites com `npm run build:cloudflare`. Esse build monta somente `hoster-dist`, sem HTML/CSS do hub.
5. Execute `npm run preflight:cloudflare` com `CLOUDFLARE_API_TOKEN` no ambiente. Além das checagens de páginas, domínios, D1 e versão ativa, o preflight exige que o Worker independente do hub responda na raiz e no CSS. Se a rota do hub não estiver ativa, **não publique o pacote sem o hub**.
6. Somente com preflight aprovado execute `npm run deploy:cloudflare`. Depois confira novamente login, hub, sites de desenvolvimento e domínios oficiais. Registre os IDs das duas versões para rollback individual. Para reverter o hub após a retirada dos arquivos antigos do hoster, restaure uma versão anterior de `jumper-hub`; apenas remover a rota do hub não restaura o painel antigo.

O token deve ficar em variável de ambiente local ou gerenciador de segredos, nunca em Git. Se o preflight falhar, **não rode `wrangler deploy` diretamente para contorná-lo**: reconcilie o conteúdo publicado com o GitHub em PR específica ou isole explicitamente o projeto que será alterado. A verificação de páginas iniciais e recursos críticos reduz o risco, mas não substitui revisão do diff nem uma checagem funcional pós-deploy.

### Reconciliação de 29/09/2026

A primeira auditoria encontrou recursos de Cerro Corá, leads IZI e briefing que faltavam no `main`. A PR #37 integrou esses recursos ao GitHub. Um novo build do `main` passou no preflight contra a versão Cloudflare `282b6913-c6de-4b31-af96-128b007ecd99`: todas as páginas iniciais protegidas e os domínios conferiram. Esse resultado é uma fotografia datada; qualquer novo deploy, commit ou mudança de assets exige reconstrução e nova auditoria antes da publicação.
