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
- Eventos: copy aprovada e contato existente. Uma fotografia de ambiente por unidade; legendas não alegam registros de eventos. A pasta Eventos recebida está vazia.
- Reservas: seleção clara de unidade, endereço e distrito atualizados, Tagme carregado por intenção e alternativa de link direto. Não enviar reservas durante testes.
- Jardins: Rua Haddock Lobo 1448, Jardins; texto sobre o novo endereço, reserva e cardápio.
- Iguatemi: Av. Brig. Faria Lima 2232, Jardim Paulistano; texto completo do PDF, reserva e cardápio.
- Diretório das duas casas, privacidade e 404 continuam úteis e acessíveis. Blog permanece desativado.

Os textos aprovados ficam centralizados em data/content.json. O novo PDF resolve o número 1448; horários e telefone individual do Iguatemi ainda precisam de confirmação, sem mudanças por suposição.

## Manutenção e arte
Página independente /em-breve/, sem substituir automaticamente a home do site ou o oficial. Fotografia BMM_35 da pasta Novo Rodeio indicada na página 2, logo branca sem cowboy, copy da página 3, dois endereços e cardápio. Exportar JPEG em 2560×1440 e 1920×1080, preservando enquadramento proporcional e legibilidade.

## Imagens, movimento e desempenho
Acervo real; sem IA, Pexels ou vídeo nesta revisão. Fotos editoriais distintas sempre que possível; galeria completa da respectiva unidade pode repetir a foto editorial. Manter as 15 imagens recebidas de Jardins, mais a nova BMM_35, e as 5 de Iguatemi, sem misturar as casas.

AVIF responsivo a partir de matrizes preservadas; imagens de conteúdo até 1600 px, ampliação de galeria até 1600 px sem upscale, prioridade alta só no primeiro hero. Remover matrizes não referenciadas do pacote final. Orçamento de até 400 KiB por derivado. Fontes locais, mapa e fornecedores apenas por interação.

Metas: desempenho Lighthouse verde e alto, CLS próximo de zero, acessibilidade e boas práticas 100. Medir a versão publicada e preservar relatórios reais. Prévia continua noindex: não anunciar SEO todo verde, métricas de campo ou garantia de PageSpeed.

## Conferência e publicação
Revisar todas as páginas em 320/390/768/1024/1440/1920; conferir as larguras de transição do menu. Chrome, Firefox e WebKit; teclado, contraste, imagens, links, galerias e reservas. Testar sem enviar formulários de terceiros.

Publicação autorizada apenas para /rodeio/ no jumper-hoster-dev, mantendo o URL público site.jumper.dev.br/rodeio/. Seguir AGENTS.md e JUMPER-HOSTER.md: branch isolada, build/testes, PR, preflight com --allow=rodeio, deploy dev pelo comando oficial, revisão e merge. Preservar os outros clientes, hub, briefing, APIs e domínios oficiais. Não executar Wrangler diretamente nem publicar live por inferência.
