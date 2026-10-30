# Prévia pública do Rodeio — 30/10/2026

O WordPress em https://rodeiosp.com.br é a fonte editorial atual. Este diretório
conserva uma captura pública revisada das 16 páginas para o dev `/rodeio/`.
A captura inclui os seis canais de Contato, Delivery atualizado e a home sem
os controles de pausa e navegação do banner. Não contém painel, credenciais,
registros de formulários ou dados administrativos.

`manifest.json` fixa os hashes dos HTMLs, runtimes e dos 155 arquivos públicos
referenciados. `source-assets.json` registra o inventário da release pública.
Os arquivos públicos existentes em `public/` devem corresponder a esses hashes.

Para atualizar a captura, executar explicitamente
`python3 scripts/capture-rodeio-wordpress-preview.py`, revisar o diff e seguir
o fluxo obrigatório do `JUMPER-HOSTER.md`. O script faz somente GETs públicos.
O build não consulta o WordPress: usa apenas os arquivos versionados.

`build:cloudflare:dev` aplica a captura ao pacote Rodeio com
`scripts/stage-rodeio-wordpress-preview.mjs`. Os links internos usam `/rodeio/`,
as páginas recebem `noindex,nofollow` e os formulários mantêm os endpoints
existentes do dev (`/rodeio/api/contato` e `/rodeio/api/eventos`). Serviços de
terceiros continuam com seus destinos públicos aprovados. Não enviar mensagens
reais para testar esta prévia.

O build live do Hoster não recebe esta sobreposição. As alterações editoriais
futuras no WordPress precisam de nova captura revisada para chegar ao dev;
não há sincronização automática nem sincronização inversa com o ACF.
