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
- Os quatro leads fictícios locais foram removidos por UUID depois de guardar evidência; banco local vazio.
- D1 remoto consultado com sucesso: tabela criada e zero registros. Wrangler fixado em 4.144.0, pois 4.148.0 retornou erro de autorização na consulta enquanto 4.144.0 e API direta confirmaram acesso.

Em 08/10/2026, o usuário confirmou CADASTRO-LP-CATIVE e conversão somente no envio confirmado. Nove testes automatizados passaram após remover conversões da página de obrigado. A validação oficial será feita após a publicação.
