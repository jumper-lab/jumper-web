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
2. o site está registrado em `jumper-hoster.registry.json`;
3. existe um card correspondente no painel raiz;
4. a rota pública `/<slug>/` e suas páginas internas respondem sem a senha do painel;
5. links, imagens, fontes, vídeos, canonical, Open Graph, sitemap e robots foram verificados no endereço do hub.

O registro e o painel devem permanecer sincronizados. A preparação do pacote de hospedagem falha se um projeto registrado não tiver card ou arquivo inicial publicado.

## Projetos atuais

- Rodeio: `/rodeio/`
- IZI Gym: `/izigym/`
- Casa Beliê: `/casabelie/`
- Casa Beliê 2: `/casabelie-2/`

Vercel pode ser usada somente quando houver pedido explícito. Ela não é origem, proxy ou etapa obrigatória do fluxo padrão.
