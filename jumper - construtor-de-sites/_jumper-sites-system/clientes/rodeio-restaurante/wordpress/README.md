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
