# Jumper Hoster

O `jumper-hoster` é o hub oficial de desenvolvimento dos sites criados pelo Jumper Site Factory.

- Hub: `https://site.jumper.dev.br/`
- Worker: `jumper-hoster`
- Endereço de cada cliente: `https://site.jumper.dev.br/[slug]/`
- Registro oficial: `jumper-hoster.registry.json`
- Acesso: o painel raiz é restrito à equipe Jumper; as rotas dos clientes são públicas.

## Regra obrigatória

Todo site concluído pelo construtor deve ser publicado neste Worker. Uma entrega só está completa quando:

1. o build usa `SITE_URL=https://site.jumper.dev.br` e base `/<slug>`;
2. o cliente e o site em desenvolvimento estão registrados em `jumper-hoster.registry.json`;
3. existe um card do cliente no painel raiz, com links separados para cada versão em desenvolvimento e para o site oficial, quando existir;
4. a rota pública `/<slug>/` e suas páginas internas respondem sem a senha do painel;
5. links, imagens, fontes, vídeos, canonical, Open Graph, sitemap e robots foram verificados no endereço do hub.

O registro e o painel devem permanecer sincronizados. O painel é gerado a partir do registro central e agrupa todas as versões pelo cliente. O campo `officialSite` pode ser `null` enquanto o cliente não tiver site em produção. A preparação do pacote falha se uma versão registrada não tiver arquivo inicial publicado ou se suas URLs não seguirem o padrão definido.

## Projetos atuais

- Rodeio: desenvolvimento em `/rodeio/` e oficial em `https://rodeiosp.com.br/`
- IZI Gym: desenvolvimento em `/izigym/` e oficial em `https://www.izigym.com.br/`, ambos servidos pelo `jumper-hoster`
- Casa Beliê: desenvolvimentos em `/casabelie/` e `/casabelie-2/`, e oficial em `https://casabelie.com.br/`

Vercel pode ser usada somente quando houver pedido explícito. Ela não é origem, proxy ou etapa obrigatória do fluxo padrão.
