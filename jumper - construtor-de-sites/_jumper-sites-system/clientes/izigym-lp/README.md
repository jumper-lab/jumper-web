# IZI Gym — landing de vendas

Landing de conversão baseada no conteúdo da campanha original e no Guia de Identidade Visual oficial da IZI Gym. O sistema usa Fields nos títulos, Obviously no corpo e na interface, canvas areia, modo noturno carvão e vermelho institucional como acento.

Preview atual: https://site.jumper.dev.br/izigym-lp-vilaromana/

Site principal: https://cerrocora.izigym.com.br/

## Operação

- `npm run dev`: desenvolvimento em `http://127.0.0.1:4327/izigym-lp/`.
- `npm run build`: gera o site estático em `dist/`.
- Implementação: `src/pages/index.astro` e `src/styles.css`.
- Design system: `DESIGN_SYSTEM.md` e `data/final-design-system.json`.
- Auditoria de aplicação: `data/brand-audit-2026-09-22.md`.
- Ativos oficiais: `public/assets/brand/`.

## Conversão

WhatsApp +55 11 95213-7022 com mensagem da promoção. O Yayforms DEXAqYo carrega apenas após o clique em matrícula. UTMs, gclid e fbclid são preservados; os eventos `whatsapp_click` e `enrollment_open` registram origem e atribuição.

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
