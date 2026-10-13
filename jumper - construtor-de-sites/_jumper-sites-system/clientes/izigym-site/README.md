# IZI Gym

Site institucional da IZI ONE / IZI Gym, academia em Alto de Pinheiros, Sao Paulo.

## Origem no jumper-web

Este código-fonte foi importado de `jumper-lab/izigym` (commit
`0c1b3b8cba2eb636cd4d948f8771da74fd95fbc0`) para centralizar os sites
Jumper fora da Kinsta em `jumper-web`. Como `main` aceita apenas PR com squash,
o histórico original foi preservado no próprio `jumper-web` pela tag
`izigym-source-import-0c1b3b8`, que aponta para o commit de origem.
`clientes/izigym-lp/` é outra página e não deve ser substituída por este projeto.

O import **não altera a publicação**. A preparação de rastreamento do principal
reconcilia este fonte com o snapshot oficial anterior e conecta seu build ao
Hoster, conforme `data/tracking/PRINCIPAL-2026-10-13.md`. O build é validado antes
de ser copiado para `_official/izigym`, usado por `www.izigym.com.br`; o apex
`izigym.com.br` mantém o redirecionamento existente para `www`.

A prévia `https://site.jumper.dev.br/izigym/` conserva o pacote separado
`cloudflare/snapshots/izigym/`, uma implementação HTML/CSS/JS diferente deste
aplicativo React. O snapshot `izigym-official/` permanece como referência
histórica. URLs, Worker e dados D1 continuam existentes. Não há deploy automático
deste diretório: publicar exige revisão e operação autorizada pelo fluxo do
Hoster. O repositório antigo só pode ser removido após a auditoria das referências
externas.

## Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui

## Como rodar localmente

```bash
npx pnpm@10.15.1 install --frozen-lockfile
npx pnpm@10.15.1 dev
```

## Scripts

```bash
npx pnpm@10.15.1 dev
npx pnpm@10.15.1 build
npx pnpm@10.15.1 test
npx pnpm@10.15.1 lint
npx pnpm@10.15.1 preview
```

## Deploy

O site oficial e a versão de desenvolvimento são publicados pelo Worker central
`jumper-hoster`, mantido no repositório `jumper-lab/jumper-web`. Este repositório
contém o código-fonte da IZI Gym e não cria um Worker independente.

Os botões de matrícula usam exclusivamente o checkout do Sistema Pacto.

## Rastreamento do principal

`src/data/tracking.json` controla o kit Izi e seu carregador GTM. Não há controle
por query string. A página produz `checkout_click` e `whatsapp_click` em uma fila
compartilhada, preservando links e atribuição. Configurar tags e destinos e
confirmar recebimento nas plataformas pertence ao `jumper-tracker`.

Contrato, lista de CTAs, observações comerciais e evidências:
[`data/tracking/PRINCIPAL-2026-10-13.md`](data/tracking/PRINCIPAL-2026-10-13.md).
