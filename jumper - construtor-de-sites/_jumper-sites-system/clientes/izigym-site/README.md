# IZI Gym

Site institucional da IZI ONE / IZI Gym, academia em Alto de Pinheiros, Sao Paulo.

## Origem no jumper-web

Este código-fonte foi importado de `jumper-lab/izigym` (commit
`0c1b3b8cba2eb636cd4d948f8771da74fd95fbc0`) para centralizar os sites
Jumper fora da Kinsta em `jumper-web`. O histórico foi preservado pelo Git subtree.
`clientes/izigym-lp/` é outra página e não deve ser substituída por este projeto.

O import **não altera a publicação**. O `jumper-hoster` ainda usa dois pacotes
distintos em `clientes/rodeio-restaurante/cloudflare/snapshots/`: `izigym/`
para `https://site.jumper.dev.br/izigym/` e `izigym-official/` para
`https://www.izigym.com.br/`. A versão de desenvolvimento é uma implementação
HTML/CSS/JS diferente deste aplicativo React; não publique o build daqui no
endereço de desenvolvimento nem substitua o snapshot oficial sem comparação.
O código, as URLs e os dados D1 devem ser reconciliados e validados em uma PR
separada antes de alterar o preparo do Hoster. Não há deploy automático deste
diretório. O repositório antigo só pode ser removido após essa transição e a
auditoria das referências externas.

## Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui

## Como rodar localmente

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Deploy

O site oficial e a versão de desenvolvimento são publicados pelo Worker central
`jumper-hoster`, mantido no repositório `jumper-lab/jumper-web`. Este repositório
contém o código-fonte da IZI Gym e não cria um Worker independente.

Os botões de matrícula usam exclusivamente o checkout do Sistema Pacto.
