# IZI Gym — landing de vendas

Landing de conversão baseada no conteúdo da campanha original e no Guia de Identidade Visual oficial da IZI Gym. O sistema usa Fields nos títulos, Obviously no corpo e na interface, canvas areia, modo noturno carvão e vermelho institucional como acento.

Preview atual: https://site.jumper.dev.br/izigym-lp-vilaromana/

Site principal: https://cerrocora.izigym.com.br/

## Operação

- `npm run dev`: desenvolvimento em `http://127.0.0.1:4327/izigym-lp/`.
- `npm run build`: gera o site estático em `dist/`.
- Landing oficial e preview v2: `src/pages/simple.astro`, `src/simple.ts` e `src/simple.css`.
- `src/pages/index.astro` permanece como versão v1 de desenvolvimento.
- Design system: `DESIGN_SYSTEM.md` e `data/final-design-system.json`.
- Auditoria de aplicação: `data/brand-audit-2026-09-22.md`.
- Ativos oficiais: `public/assets/brand/`.

## Conversão

WhatsApp +55 11 95213-7022 com mensagem da promoção. Na landing oficial, o modal de matrícula usa um formulário próprio com nome, telefone, e-mail e consentimento. O envio vai para `POST /api/izigym/leads` no Worker `jumper-hoster`; após a confirmação de gravação no D1 `izi-gym-leads`, o visitante segue para a página de agradecimento e checkout já utilizada pela campanha. UTMs, gclid e fbclid são preservados. Os eventos `whatsapp_click`, `enrollment_open` e `lead_submit` registram a interação sem enviar dados pessoais à camada de analytics.

No preview v2 em `site.jumper.dev.br`, o mesmo endpoint usa a base separada `izi-gym-leads-test`, protegida pelo acesso ao Jumper Hoster. Os cadastros de produção podem ser consultados no [D1 da Cloudflare](https://dash.cloudflare.com/e23efa36a1e09015eebb2b36bdfcf201/workers/d1/databases/28c64f5a-5163-4db9-a557-1b5ffd2067f1/studio). O v1 de desenvolvimento ainda preserva o embed histórico do YayForms.

## Regras de marca

- Fields somente para títulos e afirmações.
- Obviously para corpo, subtítulos, interface, preço e métricas.
- Botões com peso 500.
- Areia `#E6DDC9` como canvas e carvão `#434341` como modo noturno.
- Vermelho `#E52C12` usado como acento.
- Verde `#0F806F` restrito a ações reais de WhatsApp.
- Logos oficiais, sem distorção, recoloração ou alteração de proporção.

## Validação

Build aprovado. Revisão em 390×844 e 1440×900 sem overflow; hero ocupa a viewport; fontes oficiais carregam; formulário abre e fecha; CTA fixo mobile aparece apenas depois da hero; console sem erros.

## Pendências comerciais

- A origem chama o plano promocional de Premium e a tabela o nomeia Prime. Confirmar a nomenclatura antes de mídia em escala.
- Validade exata da oferta e regras adicionais não foram fornecidas e não foram inventadas.
