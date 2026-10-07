# Prompt final — Rodeio Restaurante

## Direção vigente
Fonte de copy e diretrizes: briefing/entrada/diretrizes-2026-10-02/RODEIO SITE (2).pdf, 11 páginas e links embutidos. O documento atual tem precedência sobre versões anteriores. Continuar o cliente existente no construtor Jumper, preservando as escolhas visuais já aprovadas.

A estética conecta papel quente, madeira, fotografias reais, tipografia Bodoni Moda e DM Sans, contraste marrom/creme e ferrugem nas ações. A apresentação deve ser elegante e comercialmente clara, sem transformar toda seção em cartões ou inventar informações.

## Home e primeira dobra
Hero em largura útil integral e 100vh, com cabeçalho fixo e fotografia coberta por recorte proporcional, nunca deformação. Slideshow de seis imagens já aprovadas, na ordem 2, 5, 1, 3, 4, 6: carne, marca, salão, aperitivos, costeletas, sobremesa. Fade suave, zoom uniforme muito discreto, controle manual e carregamento progressivo. Texto “O clássico que se renova” e introdução desde 1958 conforme PDF.

Proteger leitura com degradê localizado; não escurecer toda a fotografia. Título legível desde o primeiro paint, com entrada discreta e sem atrasar LCP. Demais imagens mantêm revelação suave dentro de frames fixos, sem linhas claras nos heros. Reduced motion desativa movimento e troca automática.

Sequência numerada 01 experiência, 02 clássicos e 03 casas; manter os marcadores no mesmo eixo e as imagens da gastronomia alinhadas. Novo registro BMM_88 na apresentação do novo Jardins. Acervo e convite para eventos complementam a narrativa.

## Navegação
Desktop: marca sem cowboy central, História/Cardápio/Eventos à esquerda, Jardins/Iguatemi e reserva à direita. Home pela marca. Menu móvel e rodapé têm os sete destinos na ordem do PDF: Home, História, Cardápio, Eventos, Reservas, Jardins e Iguatemi. Escape, foco contido, retorno ao acionador e indicação da página atual. Logos com e sem símbolo, brancos e escuros, preservados em public/logos.

## Páginas e texto
- História: narrativa completa do PDF, marcos 1958, 1959, 1986, 2001, 2011 e 2026; clássicos Arroz Rodeio/Biro-Biro e picanha fatiada; fotografias históricas apenas no conteúdo. Não nomear a certificação sem fonte.
- Cardápio: texto simples e poucos pratos fotografados; CTA abre o LiveMenu exato embutido no PDF. Não mostrar a foto desatualizada do cardápio impresso nem inventar pratos, ingredientes ou preços.
- Eventos: copy aprovada e contato existente. Registro recebido de evento no Iguatemi; hero identificado como ambiente dos Jardins. Ainda falta uma foto identificada de evento dos Jardins.
- Reservas: seleção clara de unidade, endereço e distrito atualizados, Tagme carregado por intenção e alternativa de link direto. Não enviar reservas durante testes.
- Jardins: Rua Haddock Lobo 1448, Jardins; texto sobre o novo endereço, reserva e cardápio.
- Iguatemi: Av. Brig. Faria Lima 2232, Jardim Paulistano; texto completo do PDF, reserva e cardápio.
- Diretório das duas casas, privacidade e 404 continuam úteis e acessíveis. Blog permanece desativado.

Os textos aprovados ficam centralizados em data/content.json. O novo PDF resolve o número 1448; horários e telefone individual do Iguatemi ainda precisam de confirmação, sem mudanças por suposição.

## Manutenção e arte
Página independente /em-breve/, sem substituir automaticamente a home do site ou o oficial. Fotografia BMM_35 da pasta Novo Rodeio indicada na página 2, logo branca sem cowboy, copy da página 3, dois endereços e cardápio. Exportar JPEG em 2560×1440 e 1920×1080, preservando enquadramento proporcional e legibilidade.

## Imagens, movimento e desempenho
Acervo real; sem IA, Pexels ou vídeo nesta revisão. Fotos editoriais distintas sempre que possível; galeria completa da respectiva unidade pode repetir a foto editorial. Manter a galeria completa de 77 fotos dos Jardins e as 16 fotos novas do Iguatemi, sem misturar as casas. Exibição progressiva de 12 e 6 fotos por etapa, respectivamente; todas disponíveis no lightbox e sem JavaScript.

AVIF responsivo a partir de matrizes preservadas; imagens padrão até 1600 px, pratos até 1920 px; ampliação Jardins até 1600 px e Iguatemi até 2400 px, sem upscale, prioridade alta só no primeiro hero. Remover matrizes não referenciadas do pacote final. Orçamento de até 400 KiB por derivado. Fontes locais, mapa e fornecedores apenas por interação.

Metas: desempenho Lighthouse verde e alto, CLS próximo de zero, acessibilidade e boas práticas 100. Medir a versão publicada e preservar relatórios reais. Prévia continua noindex: não anunciar SEO todo verde, métricas de campo ou garantia de PageSpeed.

## Conferência e publicação
Revisar todas as páginas em 320/390/768/1024/1440/1920; conferir as larguras de transição do menu. Chrome, Firefox e WebKit; teclado, contraste, imagens, links, galerias e reservas. Testar sem enviar formulários de terceiros.

Publicação autorizada apenas para /rodeio/ no jumper-hoster-dev, mantendo o URL público site.jumper.dev.br/rodeio/. Seguir AGENTS.md e JUMPER-HOSTER.md: branch isolada, build/testes, PR, preflight com --allow=rodeio, deploy dev pelo comando oficial, revisão e merge. Preservar os outros clientes, hub, briefing, APIs e domínios oficiais. Não executar Wrangler diretamente nem publicar live por inferência.

## Acervo vigente — 07/10/2026
Conferida integralmente a apresentação Google Slides (11 slides), sem nova mudança editorial: história conserva os sete parágrafos aprovados. Catálogo e seleção em briefing/entrada/acervo-atualizado-2026-10-07/. Home: rodeo_2026set_037 e 001, retratos 2:3 em colunas iguais, sem recorte adicional. Cardápio: clássicos identificados na própria legenda, `menuPicanhaFatiada` (acervo 2024) e `menuArrozRodeio` (3M7A6213); hero 354. Poucos pratos em destaque e LiveMenu em popup, sem saída do site. Iguatemi: 16 novos ambientes, evento recebido; destaques 9452/9458/9461 e slide do salão 9454. Jardins: reaproveitar originais idênticos por SHA-256, mantendo as 77 fotos. Nenhuma IA necessária. Preservar movimentos existentes; ler posições das imagens em lote para evitar recálculos de layout.

### Correção de identificação — 07/10/2026
No Cardápio, apresentar Picanha fatiada e Arroz Rodeio com o nome dentro da legenda da própria foto. Usar `menuPicanhaFatiada` (acervo 2024, Captura sem título1313.jpg) e `menuArrozRodeio` (3M7A6213.jpg). As fotos são diferentes das usadas na home. Remover a faixa de nomes desvinculada das imagens; não associar sobremesa ao arroz. Manter proporções originais 3:2 e 2:3, sem recorte; composição desktop 2,25:1 para alinhar a base das fotografias e mobile em uma coluna. A seleção anterior 067/384 permanece armazenada, mas não é mais aplicada aos clássicos do Cardápio. Hero e cardápio digital permanecem como aprovados.

### Destaque do cardápio completo — 07/10/2026
Na página Cardápio, usar “Conferir cardápio completo” nos três acessos ao menu digital. O acesso na introdução dos clássicos recebe o botão preenchido terracota da identidade, com texto branco, seta e hover padrão. Manter popup LiveMenu, foco e botão de fechar existentes.

### Hero Cardápio com foco na comida — 07/10/2026
Preservar foto 354, overlay, textos e animação aprovados. Nos derivados desktop 16:9, usar o recorte `entropy` para selecionar a área de carne/folhas; em telas horizontais, posicionar a imagem em 50% 85% para manter a comida visível dentro do banner mais largo. Derivados mobile/tablet conservam os enquadramentos anteriores. Não deformar, ampliar a matriz ou editar o conteúdo da fotografia. Conferir desktop 1440/1822/1920 e mobile 390; AVIF responsivo, qualidade desktop 60/mobile 55.

### Retorno da linha do tempo — 07/10/2026
Restaurar a composição vertical anterior da História: título à esquerda, seis anos grandes em terracota e títulos/textos ao lado, separados por linhas finas. Manter literalmente os sete parágrafos aprovados na ordem original: 1958; 1959 com o parágrafo dos clássicos em seguida; 1986; 2001; 2011; 2026. Remover a narrativa corrida seguida pela grade resumida de marcos. Mobile mantém sequência cronológica e títulos legíveis. Preservar hero e acervo fotográfico.
