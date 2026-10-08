# IZI Gym · LP de franquias

LP entregue por Bruno em `LP_IZI_GYM_PRONTO.zip`, extraída com caminhos Windows normalizados. O layout, os quatro formulários e os códigos GTM `GTM-M3GVTFV4`/Meta Pixel `1874149183549598` do arquivo foram preservados. O envio original em localStorage foi substituído por POST `/api/lead`.

## Infraestrutura exclusiva

- Domínio autorizado: https://franquias.izigym.com.br
- Worker com assets: `izi-lp-franquias`, conta Jumper `e23efa36a1e09015eebb2b36bdfcf201`.
- D1: `izi-lp-franquias-leads`, ID `4553bc65-eeb8-4404-aa57-e44692bcc9a3`.
- Studio: https://dash.cloudflare.com/e23efa36a1e09015eebb2b36bdfcf201/workers/d1/databases/4553bc65-eeb8-4404-aa57-e44692bcc9a3/studio
- Tabela `leads`: identificação, criado_em UTC, dados de contato, preferência WhatsApp, cidade, capital, cinco UTMs, página e user agent. `payload_hash` permite retries idempotentes sem expor PII nos logs.

Este Worker é independente do Jumper Hoster: nenhum deploy daqui envia Cerro Corá, o site institucional, hub, briefing ou bases existentes. Não há envio para CRM, email ou WhatsApp, nem API pública de leitura. A checkbox registra apenas a preferência já presente no formulário.

## Fluxo

As UTMs da URL de chegada são persistidas em sessionStorage. Os quatro formulários chamam a mesma função; validação de campos acontece no navegador e no servidor. O botão é bloqueado durante o envio. O banco confirma a gravação antes dos eventos de conversão e da navegação para `proximos-passos.html`. Falhas mantêm o visitante na LP com mensagem e possibilidade de tentar novamente. Um UUID por envio evita duplicação caso a resposta se perca. O endpoint limita tamanho de payload, permite somente mesma origem e tem rate limit de 20 tentativas/minuto/IP. Não aceita gravação arbitrária de um site externo.

## Desenvolvimento e publicação

`npm ci`, `npm run db:local`, `npm run dev` (porta 8787) usam D1 local isolado. `npm test` cobre validação, gravação, repetição, erro do banco, acesso, assets e integração dos quatro formulários.

Somente após confirmação do evento em `data/release.json`: PR → merge em main → checkout limpo atualizado → `npm run db:migrate` → `npm run deploy:cloudflare`. O comando verifica o escopo exato, o main remoto, os testes e o registro de confirmação antes de enviar. Não publicar com configuração local.

## Tracking entregue

O ZIP usa `CADASTRO-LP-CATIVE`. Nome pendente de confirmação com Bruno antes da publicação. A página de obrigado também dispara eventos de conversão herdados do ZIP; preservados conforme pedido, com potencial duplicidade entre envio e obrigado que deve ser considerado na configuração de mensuração.

## Acesso aos dados

A consulta fica no D1 Studio da conta Jumper. Os cadastros não são publicados na LP. Os testes usam apenas dados fictícios explicitamente identificados e são removidos por ID após validação. Definir com a equipe os responsáveis pelo acesso e retenção dos dados.
