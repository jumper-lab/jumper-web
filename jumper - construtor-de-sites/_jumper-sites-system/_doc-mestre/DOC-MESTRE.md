# Doc Mestre — Jumper Site Factory

Este é o sistema Jumper Site Factory v3.

A regra é simples: **menos processo, melhor site final**.

O sistema deve transformar um briefing em um site autoral, bonito, funcional, responsivo e pronto para apresentação, sem espalhar decisões em dezenas de documentos.

## Estrutura Mínima

```txt
_jumper-sites-system/
├── _cofre-jumper/
│   └── prompts/
│       └── build-client-site.prompt.md
├── _doc-mestre/
│   └── DOC-MESTRE.md
├── _referencias-visuais/
├── clientes/
└── scripts/
```

## Fluxo Oficial

1. Receber briefing.
2. Guardar tudo em `clientes/[slug]/briefing/`.
3. Criar ou revisar `data/design-system.json`.
4. Criar ou revisar `data/content.json`.
5. Criar ou confirmar `jumper.config.json`.
6. Ler os 3 DSs-base da personalidade como repertório.
7. Criar `data/final-design-system.json`.
8. Criar preview do DS final.
9. Criar `data/final-site-build-prompt.md`.
10. Construir o site em `src/`.
11. Revisar visualmente duas vezes.
12. Criar `data/visual-quality-audit.json`.
13. Atualizar `README.md`.
14. Rodar validação/build.
15. Registrar o site no `jumper-hoster.registry.json`, adicioná-lo ao hub e publicar em `https://site.jumper.dev.br/[slug]/`.

## Domínio de Desenvolvimento Jumper

- Todo cliente publicado para desenvolvimento pela infraestrutura Jumper recebe `https://site.jumper.dev.br/[slug]`.
- A hospedagem desse endereço acontece diretamente no Cloudflare Worker `jumper-hoster` com assets estáticos. Vercel não participa como origem, proxy ou intermediário.
- Todo site concluído pelo construtor deve entrar no registro `jumper-hoster.registry.json`, ser agrupado no card do respectivo cliente no hub `https://site.jumper.dev.br/` e ser servido no namespace público `/<slug>/`. O card deve separar os links de desenvolvimento do endereço oficial do cliente, quando existir. A entrega não está concluída enquanto registro, card e rota não estiverem sincronizados.
- O painel raiz pode exigir autenticação da equipe Jumper. As rotas públicas dos clientes em `/<slug>/` não devem herdar essa senha.
- O build usa base `/[slug]`; links, imagens, scripts, canonical, Open Graph e sitemap devem conservar esse prefixo.
- O domínio raiz `jumper.dev.br` fica reservado para a própria Jumper.
- Se o cliente fornecer e aprovar um domínio próprio para produção, ele é configurado separadamente do endereço de desenvolvimento.
- Antes de concluir o deploy, registre a URL completa em `jumper.config.json` e valide DNS, HTTPS, card do hub, rota pública, redirecionamento, canonical, Open Graph, sitemap, robots, assets e navegação interna.
- URLs `*.vercel.app` não fazem parte do fluxo padrão. Use Vercel somente quando a pessoa solicitar explicitamente.

## Arquivos Obrigatórios Por Cliente

```txt
briefing/briefing-normalizado.md
data/design-system.json
data/content.json
data/final-design-system.json
data/final-site-build-prompt.md
data/visual-quality-audit.json
jumper.config.json
src/
README.md
```

Não crie novos documentos intermediários de planejamento separado. Se aparecerem em clientes antigos, trate como contexto legado, não como regra.

## Fonte Criativa

- Briefing do cliente manda nas decisões específicas.
- DSs-base são repertório, nunca molde.
- Referências externas servem para elevar qualidade, não para copiar.
- Acessibilidade, performance e funcionamento são piso técnico.
- O DS final é a fonte visual principal do site.
- O prompt executivo final é a ponte entre DS final e código.
- Histórico externo ao cliente atual não é fonte de restrição para cliente novo.
- Se uma regra deve valer para todos, ela precisa estar neste documento, no prompt oficial ou no `AGENTS.md`; se não estiver no briefing atual, não atribua ao cliente.

## Regra Clean-Room

Cada cliente nasce do zero.

Não copie nem adapte layout, classes, CSS, componentes, hero, menu, cards, grids, rodapé, animações, textos ou estrutura visual de outro cliente.

Infraestrutura técnica pode se repetir. Linguagem visual não.

## Os Três Testes de Sucesso

Todo site do sistema é medido por três testes:

1. **Teste dos 5 segundos** — quem nunca ouviu falar do cliente abre a primeira dobra e entende o que é, para quem é, por que confiar e o que fazer.
2. **Teste do print** — um screenshot do hero, sozinho e sem logo, permitiria a um designer identificar o segmento e a personalidade do cliente. Se serviria para qualquer empresa, o hero falhou.
3. **Teste do concorrente** — ao lado do melhor site do segmento na região do cliente, este site parece mais intencional, mais claro e mais confiável.

O resultado dos três testes deve ser registrado em `data/visual-quality-audit.json`.

## Padrão Premium

Funcionar é piso.

A entrega precisa parecer final, intencional e específica do cliente.

A primeira dobra deve expressar posicionamento, desejo, confiança e conversão. Ela precisa ter:

- composição autoral;
- mídia coerente com o negócio;
- navegação refinada;
- CTA claro;
- hierarquia tipográfica madura;
- relação visual com o restante da página;
- responsividade cuidadosa de mobile a desktop largo.

### Regra de Primeira Dobra

Toda página precisa ter uma primeira dobra dominante. O hero deve ocupar a tela inteira em pelo menos um eixo: largura total, altura total ou ambos. Essa regra vale para qualquer tamanho de navegador, mobile, tablet, desktop e desktop largo.

No código, a intenção deve aparecer como composição real, não como frase no briefing: hero com `width: 100%`/full-bleed quando a largura for o eixo dominante, ou altura com `min-height` baseada em viewport (`100svh`, `100vh`, `92svh`, etc.) quando a altura for o eixo dominante. Se o hero não ocupa a primeira tela de forma clara, a primeira dobra falhou.

Exceções só valem quando forem uma decisão visual melhor para o cliente e ainda preservarem domínio de primeira dobra. Cabeçalhos pequenos, banners rasos, hero tímido, primeira seção parecendo continuação sem impacto ou dobra que parece apenas topo de documento são reprovação.

### Regra de Vazios

Espaço vazio precisa ser intenção visual. Todo vazio grande deve ser avaliado em screenshot: se ele cria luxo, foco, ritmo ou expectativa, pode ficar; se parece buraco, asset que não carregou, seção incompleta, excesso de padding, grid quebrado ou área sem função, deve ser redesenhado.

Na revisão final, qualquer faixa vazia que apareça em mobile, tablet ou desktop deve ser tratada como problema até prova contrária. Whitespace é ferramenta; buraco é erro.

O sistema deve reprovar internamente qualquer solução que pareça template sem direção, dependa de decoração sem função, use mídia incoerente, tenha hierarquia fraca, quebre alinhamento, prejudique leitura ou não ajude o visitante a entender e agir.

## Padrão de Ofício

"Premium" e "autoral" não são adjetivos; são critérios verificáveis. O detalhamento operacional vive no prompt oficial (`_cofre-jumper/prompts/build-client-site.prompt.md`); o resumo de lei é este:

- **Tipografia** — fontes escolhidas por intenção e justificadas no DS final; escala fluida com contraste real entre display e texto; largura de linha, line-height e letter-spacing tratados como decisão, não como default.
- **Ritmo** — escala de espaçamento nomeada e obedecida; densidade variando entre seções; whitespace como ferramenta, não como sobra.
- **Cor** — poucos papéis, contraste verificado numericamente (WCAG AA) em todos os pares de texto usados, com as razões registradas no DS final.
- **Composição** — variação estrutural entre seções vizinhas; o esqueleto "título centralizado + subtítulo + grid de cards" repetido é reprovação.
- **Assinatura visual** — todo site tem pelo menos um elemento de assinatura, nomeado no DS final (`signature_element`) e aplicado com consistência em pelo menos três pontos. É o que faz o site parecer desenhado, não montado.
- **Ousadia orçada** — ousado em 2 ou 3 lugares definidos no DS final, disciplinado em todo o resto.
- **Motion** — guia leitura e dá acabamento; nunca o mesmo efeito carimbado em tudo; `prefers-reduced-motion` sempre respeitado.
- **Copy** — headlines que só este cliente poderia dizer; CTAs com verbo + resultado; microcopy cuidada; clichês ("Bem-vindo ao nosso site", "Qualidade e compromisso", "Soluções personalizadas", "Saiba mais" como muleta) reprovados de ofício.

### Padrões proibidos de ofício (anti-slop)

Reprovados em qualquer cliente, salvo pedido explícito no briefing: hero genérico com gradiente e blobs; três cards idênticos como resposta universal; emoji como ícone; radius e sombra uniformes em tudo; a mesma anatomia de seção repetida na página inteira; foto de banco clichê (aperto de mãos, call center sorrindo); footer inchado com colunas vazias; glassmorphism/neon sem raiz no briefing; decoração sem função.

## Mídia Provisória

A ordem padrão é:

1. assets reais do cliente;
2. imagem gerada por IA sob medida para o cliente;
3. Pexels como segunda opção;
4. fallback estático bem desenhado quando nenhuma mídia externa fizer sentido.

Use imagem gerada por IA quando o site precisar de uma cena específica, premium, autoral ou difícil de encontrar em banco de imagens. A imagem deve nascer do briefing, do DS final e do prompt executivo.

Use Pexels somente quando a foto ou vídeo encontrado tiver assunto claro, crop bom, peso aceitável e relação direta com o cliente. Vídeo bonito sem contexto é reprovado.

Toda mídia temporária deve entrar como peça visual finalizável e documentada para futura troca por asset real.

## Revisão Final

Revisar significa olhar, não relembrar. Rode o build e o preview do cliente; se houver ferramenta de browser ou screenshot no ambiente, capture as páginas principais em 320, 768, 1024 e 1440+ e examine as capturas. Se não houver, audite o HTML gerado e o CSS seção por seção, simulando cada viewport com rigor.

Antes de declarar pronto, revise duas vezes:

1. Impacto e direção: primeira dobra (testes dos 5 segundos e do print), assinatura visual, hierarquia, ritmo, mídia, menu, CTAs e copy inteira relida.
2. Responsividade e acabamento: cada viewport sem scroll horizontal nem texto cortado, estados percorridos, links, performance, acessibilidade e conteúdo.

Se ainda houver dúvida, revise uma terceira vez.

Regra de honestidade: se você reprovaria a tela no site de um concorrente, reprove na sua.

Critério obrigatório:

O site precisa atingir padrão premium de especificidade, confiança, desejo, conversão, responsividade e acabamento. Se não atingir, o site não está pronto.

## Auditoria Honesta

`data/visual-quality-audit.json` deve conter o resultado dos três testes de sucesso, os passes de revisão com o que foi encontrado e corrigido, e o campo `known_issues` com o que ficou aquém e por quê.

`known_issues` é obrigatório. Auditoria sem nenhuma ressalva registrada é sinal de auditoria desonesta, não de site perfeito.

## Definição de Pronto

O site só está pronto quando todas estas afirmações são verdadeiras:

- build verde, doctor passando e **gate aprovado** (`npm run gate -- [slug]`) — o gate é lei executável, não promessa: clichês de copy, `<img>` sem alt ou sem dimensões, vídeo sem poster, motion sem `prefers-reduced-motion`, hero sem altura de viewport, fontes de CDN externo, mídia acima do orçamento, SEO técnico incompleto no `dist/` e auditoria sem ressalva substantiva REPROVAM;
- zero scroll horizontal e zero texto cortado ou sobreposto de 320px a desktop largo;
- todos os links, CTAs e formulários funcionam;
- nenhum dado inventado; todo provisório está marcado e documentado no README;
- contraste AA verificado em todos os pares de texto usados;
- hero de cada página domina a primeira dobra ocupando largura total, altura total ou ambos em todos os viewports;
- espaços vazios grandes foram revisados em screenshot e nenhum buraco visual sobreviveu;
- primeira dobra passa no teste dos 5 segundos e no teste do print;
- assinatura visual presente e consistente;
- nenhum padrão anti-slop sobreviveu;
- blog validado nos 7 passos, quando ativo;
- auditoria honesta gerada e README do cliente atualizado.

## Piso Funcional Por Modelo (M1–M4)

O site é ferramenta, não folheto. Cada modelo tem um piso de funcionalidade que resolve a vida do negócio local. Modelo maior soma ao piso do anterior. **Regra de ouro:** toda funcionalidade que pesa (mapa, chat, player, terceiros) entra sob demanda — carregada por interação, `loading="lazy"`, ou embed adiado — para nunca sabotar a nota AAA+.

- **M1 — presença essencial:** CTA de conversão direto (WhatsApp com mensagem pré-preenchida ou telefone clicável), localização com endereço e link de rotas, horário de funcionamento, dados estruturados `LocalBusiness`. É o mínimo para o "teste dos 5 segundos" virar ação.
- **M2 — soma:** formulário de contato que envia e confirma (com estados de erro/sucesso), galeria real do negócio, prova social verdadeira (avaliações/depoimentos, nunca inventados), status "aberto agora" quando fizer sentido.
- **M3 — soma:** catálogo/cardápio/serviços navegável, agendamento ou reserva (nativo ou via integração), mapa interativo carregado sob demanda, múltiplas páginas com navegação madura.
- **M4 — soma:** blog/novidades editável (Blog Autônomo Jumper), área administrativa, e recursos de app quando o briefing pedir (PWA/instalável, multilíngue). Aqui o site é uma plataforma, não uma página.

Nada nesta lista justifica peso: um mapa que derruba o LCP ou um chat de terceiro que trava a interação REPROVAM. Funcionalidade premium é a que aparece quando é útil e some do caminho crítico quando não é.

## Comandos

```bash
npm install
npm run doctor
npm run build
npm run gate -- [slug]
```

`npm run doctor` verifica a estrutura mínima do sistema (prontidão, com avisos).

`npm run build` roda a validação principal do sistema.

`npm run gate -- [slug]` é o gate de entrega por cliente: valida leis executáveis no código-fonte e no `dist/` e REPROVA com exit 1 quando alguma é violada. Sem gate verde, o cliente não está pronto para entrega. Rode o build do cliente antes (o gate lê o `dist/`).

Orçamento de mídia configurável por cliente em `jumper.config.json`:

```json
"gate_budget": { "max_video_mb": 5, "max_image_kb": 400, "max_font_files": 8 }
```

O build do site de um cliente deve ser rodado dentro da pasta desse cliente.

## Blog Autônomo Jumper

Use este módulo somente quando o cliente tiver blog, novidades ou artigos editáveis.

Clientes sem blog não precisam deste módulo.

### Quando Ativar

Ative quando:

- `data/content.json -> blog.enabled = true`;
- o briefing pedir blog, novidades ou artigos;
- o modelo contratado incluir blog editável.

### O Que O Cliente Precisa Conseguir Fazer

Em `/admin/`, depois de digitar a senha correta, o cliente deve poder:

- criar post;
- editar post;
- publicar;
- salvar rascunho;
- arquivar;
- excluir;
- inserir imagem por caminho;
- subir imagem local;
- ver posts separados por publicados, rascunhos e arquivados.

Antes da senha, o painel não pode mostrar lista, editor ou dados administrativos.

### Rotas Obrigatórias

```txt
/admin/
/blog/
/blog/[slug]/
/api/blog-posts
/api/blog-upload
```

### Arquivos Obrigatórios No Cliente

```txt
data/blog-posts.json
public/uploads/blog/
src/pages/admin/index.astro
src/pages/blog/index.astro
src/pages/blog/[slug].astro
src/pages/api/blog-posts.[js|ts]
src/pages/api/blog-upload.[js|ts]
src/lib/blogStore.[js|ts]
```

### Segurança

- A senha real deve vir de `BLOG_ADMIN_PASSWORD`.
- Senha errada retorna `401`.
- Sem senha, APIs públicas retornam somente posts `published`.
- `draft` e `archived` não aparecem no blog público.
- Não usar auto-login por `localStorage`.
- Fallback local de senha só pode existir para preview e deve estar documentado no README do cliente.

### Astro

Quando o blog existir:

- usar `output: "server"`;
- usar adapter Node (`@astrojs/node`);
- manter `npm run build` verde;
- documentar no README como trocar senha, publicar, arquivar e subir imagem.

### Validação Do Blog

Antes de entregar:

1. Abrir `/admin/` sem senha e confirmar que lista/editor não aparecem.
2. Testar senha errada e confirmar `401`.
3. Testar senha correta.
4. Criar post de teste e apagar depois.
5. Arquivar um post e confirmar que ele some do blog público.
6. Subir imagem de teste e apagar depois.
7. Rodar `npm run build`.
