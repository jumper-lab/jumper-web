# SEO — Rodeio

O WordPress publicado usa os campos do Yoast SEO como fonte de títulos, descrições, URL canônica, diretivas de indexação e compartilhamento. `wordpress/seo.php` integra a API pública do Yoast ao HTML do tema. Alterações nos campos Yoast limpam o cache; a versão estática é a contingência caso o plugin não esteja disponível.

`data/seo.json` mantém o padrão das 16 páginas para novas versões e para o dev. Alterações editoriais no WordPress devem ser reconciliadas nesse arquivo antes de uma futura publicação para não sobrescrever o trabalho. Os corpos das páginas continuam sendo páginas nativas em um bloco HTML, com verificação de hash antes da sincronização.

Doze páginas são indexáveis. Quatro páginas utilitárias (`cardapio/completo`, `eventos/orcamento`, `reservas/jardins`, `reservas/iguatemi`) recebem noindex/follow e ficam fora do sitemap. Seus links e funções continuam ativos. O dev inteiro permanece noindex/nofollow.

As duas unidades têm marcação Restaurant própria com endereço, foto, horários regulares, cardápio e mapa. Não foram inferidos telefones individuais, coordenadas, preços ou avaliações. As exceções de feriados continuam informadas em texto; nenhuma data de feriado foi inventada no schema.

Validação: `npm run check`; build WordPress; `node scripts/tests/seo-contract.mjs <pacote>`; teste PHP isolado na versão atual; preflight e deploy dev restritos ao slug rodeio; teste público das 16 páginas e sitemap; navegação e formulários simulados, sem envios reais. Backups externos ao diretório público devem preceder alterações remotas.

Pendências externas: acesso ao Search Console e aos perfis Google das duas unidades para cobertura, dados de campo e consistência das fichas. Nenhuma conta foi criada nem propriedade reivindicada.

Referências: https://developer.yoast.com/customization/apis/surfaces-api/ e https://developers.google.com/search/docs/appearance/structured-data/local-business.
