# IZI Gym — Design System Digital

Este sistema traduz o guia oficial para páginas de venda. O princípio visual é **areia durante o dia e carvão no modo noturno**. O vermelho quente funciona como pontuação, em pequenas doses, para guiar o olhar até a ação.

## Fundamentos

| Papel | Token | Uso |
|---|---|---|
| Canvas | `#E6DDC9` | Fundo principal da página |
| Tinta | `#434341` | Texto e seções noturnas |
| Painel | `#595857` | Cards sobre carvão |
| Neutro | `#939394` | Texto secundário, evidência e linhas |
| Papel | `#FFFFFF` | Texto sobre carvão e bordas |
| Acento | `#E52C12` | Pontuação, destaque e CTA principal |
| WhatsApp | `#0F806F` | Somente ações que abrem o WhatsApp |

### Tipografia

- **Fields**: títulos, teses e afirmações. Nunca usar em corpo de texto.
- **Obviously**: corpo, subtítulos, interface, preço e métricas.
- Botões usam Obviously Medium (`500`), sem bold.
- Corpo mínimo de 16 px no contexto geral; textos auxiliares de 12–14 px somente quando o papel é secundário.

### Escala responsiva

- Título desktop: `clamp(42px, 4.5vw, 68px)`.
- Título mobile: `clamp(37px, 10vw, 47px)`.
- Hero mobile: `clamp(35px, 10vw, 46px)`.
- Métrica principal: Obviously Black, sem competir com o título.
- Espaçamento base: 8 px; seções entre 48 px (mobile) e 88 px (desktop).

### Forma e movimento

- Raios: 8, 18 e 38 px; CTAs e etiquetas usam pílula completa.
- Movimento com `cubic-bezier(0.22, 0.61, 0.36, 1)`.
- Durações: 220, 440 e 880 ms.
- A seta da hero pode respirar com deslocamento curto; `prefers-reduced-motion` desativa a animação.

### Logotipo

Use somente os arquivos oficiais em `public/assets/brand`. Mantenha área livre equivalente à altura do “G”, tamanho digital mínimo de 25 px e proporções originais. A versão branca é usada sobre o hero; a vermelha, sobre o canvas areia.

## Componentes de venda

1. Hero com oferta, benefício, CTA e endereço.
2. Prova social e fatos verificáveis.
3. Card compacto de condição comercial.
4. Experiências em cards e carrossel mobile.
5. Estrutura em vídeo sob demanda.
6. Planos, objeções e transparência de renovação.
7. Fechamento com localização e CTA.
8. Barra fixa mobile exibida apenas depois da hero.

A cor verde é uma exceção funcional para ações que realmente abrem o WhatsApp. Formulários internos e CTAs de navegação usam o acento institucional.
