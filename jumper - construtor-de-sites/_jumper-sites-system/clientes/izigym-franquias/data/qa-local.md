# IZI Franquias · Testes locais · 08/10/2026

- Os quatro formulários (hero/rodapé em desktop/mobile) foram preenchidos no navegador e enviados ao Worker local com D1 local.
- Dados fictícios qa-*@example.invalid, nomes TESTE QA LOCAL — NÃO CONTATAR.
- UTMs: source=teste, medium=email, campaign=izi-franquias, content=desktop/mobile, term=franqueado.
- Hero recebeu query; rodapé abriu sem query e preservou todas as UTMs por sessionStorage.
- Checkbox desmarcada foi gravada como 0; marcada como 1.
- Três opções de capital cobertas nos envios reais.
- Redirecionamento observado para a página de obrigado apenas após confirmação do endpoint.
- Com o Worker local parado, envio não navegou, mostrou mensagem e permitiu nova tentativa. A tentativa subsequente após reinício foi gravada.
- 8 testes automatizados passaram (assets + campos + escrita + idempotência + conflitos + origem + tamanho + rate limit + falha D1).
- Pacote Wrangler dry-run validado para um único domínio e um único banco novos.

Ainda sem publicação oficial/testes no D1 remoto: confirmação do evento exigida pela tarefa está pendente.
