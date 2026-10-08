# IZI Franquias · Validação oficial · 08/10/2026

Publicado em https://franquias.izigym.com.br/ com HTTPS pelo Worker independente `izi-lp-franquias`.

- Fonte publicada: main `1672cff7`; versão Cloudflare `0ab7a642-bc1d-4fd7-a116-96a3145a6176`.
- D1 `izi-lp-franquias-leads`, UUID `4553bc65-eeb8-4404-aa57-e44692bcc9a3`; tabela `leads`.
- Dez testes automatizados passaram. A declaração UTF-8 foi movida antes dos scripts de rastreamento em ambas as páginas para corrigir a leitura dos acentos na publicação oficial.
- Envio real no navegador desktop pelo formulário do hero: registro `2fdaa482-ebba-4690-ab6b-e13b3ee42ce7` confirmado no D1, consentimento WhatsApp 0 e capital "Estou avaliando com sócios".
- Envio real no navegador em viewport mobile 390×844 pelo formulário do rodapé: registro `e835ef5d-2e93-4f7c-aaad-ba280052fa59` confirmado no D1, consentimento 1 e capital "Ainda estou estruturando o investimento".
- Ambos usaram dados fictícios @example.invalid. Todos os campos, página de origem e user agent foram conferidos no D1 remoto.
- UTMs nos dois registros: source=teste, medium=email, campaign=qa-izi-franquias-20261008, content=desktop/mobile e term=franqueado. O teste mobile entrou com UTMs e navegou para a página sem query antes de enviar: sessionStorage preservou a atribuição.
- Ambos redirecionaram somente após confirmação do endpoint para `/proximos-passos`, URL canônica da página de obrigado. Não houve compra nem envio a CRM/e-mail/WhatsApp.
- Conversão `CADASTRO-LP-CATIVE` autorizada pelo usuário e disparada somente após envio confirmado. A página de obrigado conserva os carregadores GTM/Pixel e PageView, sem nova conversão de cadastro.
- Capturas reais das linhas no Cloudflare Studio foram salvas antes da limpeza. Os dois registros foram removidos por UUID e campanha exatos; DELETE confirmou duas remoções e SELECT confirmou zero desses registros restantes.

O hub inclui links separados para a LP oficial e seu D1; o painel de Cerro Corá continua vinculado somente aos bancos próprios daquela LP.

Pendências externas de Cerro Corá para Ivy/Pacto: validar preservação das UTMs até a compra finalizada e corrigir/confirmar o preço no checkout. No teste anterior o cupom 0,99_IZI foi reconhecido, mas a primeira parcela exibida era R$ 140,99, em vez de R$ 0,99. Nenhuma compra foi concluída.
