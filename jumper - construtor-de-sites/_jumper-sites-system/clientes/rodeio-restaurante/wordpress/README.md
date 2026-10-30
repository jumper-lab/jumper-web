# Publicação do Rodeio no WordPress

O site oficial usa o tema ativo `rodeio-2026`. O pacote reproduz o HTML aprovado no dev e mantém os formulários Forminator existentes. O conteúdo principal passa a pertencer às páginas nativas identificadas por `_rodeio_managed_route`; o tema mantém cabeçalho, rodapé, estilos, scripts e lightboxes da release aprovada.

## Build

Execute de uma revisão limpa integrada ao `main`:

```sh
npm run build:wordpress -- --release=rodeio-AAAAMMDD-identificador --output=/caminho/local/privado
```

O comando faz o build de produção, substitui referências dos assets pelo caminho da release dentro do tema e adapta os destinos de formulário para `/wp-json/rodeio/v1/eventos` e `/wp-json/rodeio/v1/contato`. O manifesto registra os hashes dos arquivos e a revisão Git. A página provisória mantém `noindex`; as páginas públicas não podem conter referências ao preview.

## Conferência e publicação

- Validar a sintaxe dos arquivos PHP em PHP 8.0 ou posterior sem executar o arquivo completo. Testar o handler de contato com `pre_http_request` interceptando **todas** as chamadas externas; não enviar mensagens reais sem autorização.
- Conferir o pacote em navegador, incluindo assets, navegação mobile, formulários, cardápio e links.
- Antes de qualquer troca, comparar o hash do `functions.php` ativo com o estado revisado. Fazer backup verificado do tema, configuração e banco fora do document root, com acesso restrito.
- Instalar os arquivos em `releases/<identificador>/`. Os assets dessa release são imutáveis e têm URLs próprias. Validar todos os hashes antes de ativar.
- Promover por substituição atômica de `functions.php`, que aponta para a pasta de páginas da release. Preservar os arquivos e endpoints existentes. Atualizar a versão do tema e limpar o cache de páginas do mesmo site.
- Conferir as páginas e lightboxes públicos, os assets e os endpoints com requisições que não criem mensagens. Em falha, restaurar atomicamente os arquivos do tema guardados no backup e limpar o cache.

## Páginas nativas

Cada página guarda o HTML aprovado do interior de `<main>` em um bloco HTML no editor WordPress. A chave `_rodeio_managed_route` relaciona a página à rota; a inicial usa `/`. O tema insere esse conteúdo na estrutura aprovada. As páginas antigas ficam em rascunho, com slugs de arquivo e backup. O sitemap é gerado pelo Yoast a partir das páginas publicadas; o sitemap antigo redireciona para o de páginas. Uma nova release deve sincronizar os blocos das páginas gerenciadas após revisão para evitar que conteúdo antigo sobreponha a release.

## Formulários

| Canal | ID Forminator | Página nativa |
|---|---:|---:|
| Eventos | 364 | 805 |
| SAC Jardins | 363 | 826 |
| SAC Iguatemi | 318 | 826 |
| Compliance | 393 | 827 |

Os destinatários e registros de mensagens continuam administrados pelo Forminator. A conexão Novamira e suas credenciais não fazem parte do pacote. O acesso ao servidor usa a configuração MCP local, sem credenciais em argumentos, código versionado ou logs.

## Prévias de edição — 1.9.0

Computador e Celular abrem uma prévia lateral que acompanha os campos ainda não salvos, com atualização local após a digitação ou seleção de imagem. É possível continuar editando com a prévia aberta. Clique em um texto, imagem ou item de menu para destacar seu campo. Dados compartilhados abrem a área de origem em outra aba, já no campo correspondente; o PDF usa seu painel próprio. As alterações locais aparecem nos dois modos sem salvar nem reabrir. Apenas Atualizar publica no site. A prévia usa os rascunhos da aba atual; outras abas e ambientes não recebem edições não salvas. Em telas estreitas, o painel fica na parte inferior.

`tests/editor-devices.php` verifica a cobertura dos alvos e a ausência de conteúdo executável nas prévias, sem salvar dados. `tests/editor-devices-routing.cjs` testa os scripts reais com fixtures privadas do ACF e `jsdom@26`: defina `RODEIO_AUDIT_RUNTIME` como a pasta da instalação do jsdom e passe a pasta das fixtures como argumento. Esse teste verifica roteamento de eventos; tamanho, visibilidade e clique físico exigem conferência adicional no navegador.

Na auditoria de 29/10/2026 passaram 1.118 verificações de integração em 20 editores e 40 aberturas/seleções representativas no Chrome (16 páginas e quatro áreas, nos dois modos). Também foram conferidos o clique no título inicial, um item secundário do menu móvel e a abertura dos campos compartilhados na aba correta. Conteúdos publicados, configurações dos formulários e PDF foram preservados.

Na versão 1.9.0 (30/10/2026), passaram 1.306 verificações nos 20 editores, incluindo amostras de edição não salva de texto, link e imagem em cada editor aplicável, os 12 campos compartilhados e renomeação, inclusão, remoção e reordenação de menus. No Chrome, um título foi editado e restaurado com a prévia aberta em computador e celular. Nenhum conteúdo foi publicado nesses testes. O debounce de 100 ms é acelerado apenas no teste de integração.
