# Prompt Final de Construção — Rodeio Restaurante

## Prompt Visual Executivo
A nova direção começa com a fachada contemporânea do Rodeio em tela cheia, sob cabeçalho com marca central e navegação equilibrada. O título claro sobre a metade esquerda da fotografia tem leitura protegida por uma camada escura; o laranja segue reservado à conversão. A entrada real da casa permanece reconhecível à direita. O hero inteiro, incluindo o cabeçalho, tem exatamente 100vh. No celular, a composição é recalculada para manter texto, reserva e fotografia presentes.

Cada capítulo muda o ritmo: experiência com título e manifesto ao lado do serviço; gastronomia em marrom profundo com duas escalas de fotografia; casas em linhas alternadas, com endereço e ações ao lado da imagem; memória em papel com acervo amplo; convite de evento acompanhado por uma fotografia íntima. O rodapé encerra com tipografia de presença e os caminhos comerciais. As páginas internas devem ter diagramação própria, além do hero: cronologia narrativa, cardápio editorial, informações práticas agrupadas, eventos fotográficos e escolha de reserva clara.

Preservar as entradas aprovadas de texto. Fotografias permanecem fixas e aparecem por opacidade após carregar. Sem parallax, loops ou transições que atrasem navegação. Revalidar contraste, recortes, 100vh, teclado e integrações em todos os viewports. Esta revisão é local; publicação continua separada.

## Síntese Profunda do Cliente
O Rodeio comunica carnes, cozinha, acolhimento e continuidade familiar. Nasceu em 1958 na Haddock Lobo; a família Macedo assumiu em 1959; Silvia passou a trabalhar com o pai em 1986. A história menciona um novo endereço nos Jardins em 2026, mas não dá número novo confirmado. Preservar os endereços do briefing e documentar essa pendência para publicação. O público busca segurança para encontros, negócios e celebrações e não decide principalmente por preço.

## Objetivo Comercial
Gerar desejo pela experiência, sustentar a confiança na casa e facilitar a reserva correta. “Reservar uma mesa” resolve o CTA bruto “Agendar atendimento” sem alterar a intenção comercial. Eventos levam ao formulário oficial existente, sem inventar destinatário de e-mail. Não fabricar avaliações, cardápio, preços, prêmios ou promessas.

## Correção visual solicitada — 09/09/2026
Todas as fotografias de hero, inclusive internas, devem preencher a largura útil inteira e 100vh, atrás do cabeçalho fixo. Eliminar molduras e divisão texto/foto. Usar sobreposição escura para leitura, sem esconder o contexto da foto. Cada página tem link discreto de descida para a primeira seção seguinte; na 404, para o rodapé. Privacidade e 404 mantêm abertura tipográfica sem inventar fotos.

## Primeira Dobra
Ajuste solicitado: todo hero ocupa 100vw de largura útil e exatamente 100vh de altura, sem descontar o cabeçalho. Cabeçalho fixo sobre a área reservada no topo do hero. A home usa fotografia imersiva; as páginas internas preservam composição de texto e fotografia em duas colunas no desktop e empilhada no mobile. Telas muito baixas preservam leitura com rolagem interna do texto. Sem limite de largura de 1920px. Motion autoral: entrada sequenciada como serviço à mesa, revelação discreta de capítulos e fotos, transição suave de páginas como troca de folha de cardápio. Sem loops, parallax ou bloqueio de cliques; movimento reduzido desativa animações.

## Menu e Navegação
Cabeçalho fixo branco quente, logo oficial central entre dois grupos de navegação e reserva na extremidade direita; painel móvel marrom com links claros e índices editoriais. Abaixo do ponto em que os links cabem, menu modal nativo com botão de fechar, Escape, foco contido e retorno ao acionador. Link da página atual marcado com aria-current. Links de restaurantes abrem página com as duas unidades; subpáginas têm detalhes e ações individuais. Não criar scroll sequestrado.

## Mídia, IA, Pexels e Vídeo
Usar fotos reais do Drive, rastreadas no inventário. Originais em briefing/entrada/originais; versões leves WebP em src/assets com pipeline Astro gerando AVIF, srcset e dimensões. Fachada é mídia principal especificada no briefing. Fotos de pratos e serviço não devem receber nomes de ingredientes que não foram informados. IA é primeira opção provisória apenas se o acervo deixar uma lacuna; nesta entrega não há lacuna que justifique gerá-la. Pexels continua segunda opção quando falta foto real e a mídia autoral não resolver; não utilizado. Não há vídeo recebido e não incluir autoplay. Marca e favicon do site oficial; manual indisponível e cor laranja interpretada, sem declarar certificação de marca.

## Estrutura do Site
- `/`: primeira dobra; experiência à mesa; gastronomia; unidades; memória; evento; rodapé.
- `/historia/`: foto histórica e marco 1958; narrativa factual 1958, 1959, 1986 e 2026; presente da casa; reserva.
- `/cardapio/`: foto de prato; picanha fatiada e arroz Rodeio citados no briefing; link do menu oficial completo; fotografia gastronômica em galeria.
- `/restaurantes/`: duas casas, informações claras e links de detalhe.
- `/restaurantes/jardins/` e `/restaurantes/iguatemi/`: fotos corretas por unidade, endereço do briefing, horários informados, rotas, mapa por clique, reserva da unidade.
- `/eventos/`: fotografia real de ambiente, encontros/celebrações/negócios conforme briefing, canal oficial de orçamento e telefone real. Não simular envio de formulário.
- `/reservas/`: escolha da unidade e ativação sob demanda do widget oficial Tagme; alternativa sempre visível de abrir o sistema oficial na mesma aba. Não submeter reservas durante testes.
- `/privacidade/`: descrição estrita do funcionamento do preview, integrações carregadas por clique e ausência de formulário próprio; não inventar responsável legal.
- `/404`: página desenhada com retorno ao início e reservas.
Blog desativado explicitamente no briefing: sem área administrativa desnecessária.

## Componentes e Interações
Botões retangulares com alvos de 44px, hover escurecido e outline de foco; links textuais sublinhados e setas discretas em SVG. Galeria em dialog nativo com texto alternativo, foco e Escape. Reserva tem botões de unidade com aria-pressed, contexto de endereço, botão de carregar, status acessível e link externo. Mapa só surge após interação; falha externa nunca deve impedir rota direta. Todos os fluxos básicos devem ser utilizáveis sem JavaScript através de links.

## Critérios de Qualidade Premium
O padrão premium é medido por tipografia, imagem real, composição específica e clareza comercial. A assinatura é o filete de mesa com legendas factuais; aparece na base do hero, capítulo de gastronomia, linha do tempo e escolha de unidades. Não tornar cada seção um cartão. Recalcular contraste em todos os pares: marrom/branco quente, laranja/branco quente, branco/laranja, cinza-marrom/branco quente. Fontes locais Bodoni Moda 500 normal/itálico e DM Sans variável. Sem dependências de interface do lado cliente; JS restrito a comportamento útil. Responsividade recompõe de 320 a 1920px. SEO com head canônico da infraestrutura, descriptions únicas, JSON-LD Restaurant, sitemap, robots e favicon. Revisão mantém noindex; o build de desenvolvimento usa https://site.jumper.dev.br/rodeio como canonical e é servido diretamente pelo Cloudflare.

## Checklist de Revisão Visual
1. Rodar build e abrir em navegador com ferramenta agent-browser.
2. Inspecionar screenshots de todas as páginas em 320, 768, 1024 e 1440+, especialmente fachadas, títulos e navegação.
3. Primeira revisão: impacto, marca, hierarquia, serviço à mesa, ausência de clichês e composição própria.
4. Segunda revisão: responsividade, teclado, menu, dialogs, galerias, estados de reserva, links e mapa sob demanda.
5. Revisar espaços vazios: nenhum buraco, faixa morta, asset ausente, padding exagerado ou área sem função em qualquer viewport. Ajustar qualquer bloco que pareça sobra.
6. Teste dos 5 segundos: restaurante, São Paulo, desde 1958, reserva. Teste do print: fachada mais discurso gastronômico adulto. Teste do concorrente: registrar limites da comparação, nunca autoproclamar superioridade sem observação.
7. Não realizar envio real de orçamento ou reserva em testes.

## Critério de Pronto
Build do cliente e gate executável aprovados; duas revisões visuais documentadas; auditoria honesta com known_issues; README operacional com fontes, comandos, preview e condições para publicação. Um preview apresentável não equivale a implantação pública. Não publicar em domínio que o usuário não definiu. Informar de forma breve as limitações materiais: manual, horários por unidade e endereço da mudança de 2026.

## Revisão Geral — Direção Executiva Atual
Redesenhar composição, hierarquia e ritmo de todas as páginas com mudanças visíveis. Preservar identidade, briefing e funcionalidades. Não repetir o mesmo bloco texto/foto em cada capítulo. A home começa pela fachada imersiva, segue para o serviço e a gastronomia, organiza as casas em linhas alternadas e encerra com memória e convite fotográfico. As páginas internas ganham abertura de seção, legendas, agrupamento de informações e contraste entre capítulos conforme o conteúdo. Testar o resultado real duas vezes; corrigir qualquer colisão, vazio sem função ou perda de legibilidade. Não publicar sem autorização específica.

## Entrega da fotografia da home
Usar picture com duas proporções de entrega em portrait:3:5 no celular e4:5 no tablet. Gerar os AVIF diretamente da fotografia real com fit cover centralizado, qualidade55 nos recortes portrait e widths responsivos; fotografias gerais permanecem em60. Evitar transferir a imagem inteira para descartar as laterais no celular. Desktop continua com a foto inteira. Conferir letreiro, vegetação e presença da fachada depois do recorte.

## Revisão de gastronomia — 09/09/2026
Na home, agrupar a seção Clássicos à mesa em um único bloco: fotografia de prato à esquerda, título, texto e acesso ao cardápio à direita. Sobremesa em detalhe pequeno junto ao texto, sem segunda imagem gigante, vazios ou frase solta. Fundo creme, marrom e laranja do Rodeio. No celular, título e chamada antecedem a fotografia principal, com sobremesa compacta ao final.

## Curadoria fotográfica — 09/09/2026
Evitar repetir fotografias entre páginas, heros, galerias e chamadas. Destinar uma imagem real diferente para cada posição, respeitando a unidade fotografada. Reservar arquivo histórico de resolução limitada para o conteúdo; hero de História usa ambiente contemporâneo com legenda correta. Recuperar matrizes originais para nitidez e gerar recortes responsivos próprios de hero em AVIF sem encadear compressões com perda. Preservar 100vh, recortes intencionais, contraste e noindex. Medir o desempenho e registrar metas pendentes com honestidade.

## Alinhamento de Clássicos à mesa — 09/09/2026
Marcador 02 no topo esquerdo da seção, no mesmo eixo dos capítulos 01 e 03. Cabeçalho com título à esquerda e introdução/CTA à direita; abaixo, fotografias com topo e base alinhados, legendas na mesma linha. Eliminar escalonamentos e centralização vertical que escondam o número. No celular, ordem linear e sem colunas comprimidas.

## Galerias completas por unidade — 09/09/2026
A pedido do usuário, exibir todas as fotos da pasta Jardins (15) e Iguatemi (5), em galerias separadas nas respectivas páginas. Esta coleção completa pode repetir imagens já usadas editorialmente, como exceção explícita à curadoria anterior. Grade uniforme, miniaturas responsivas e lazy, ampliação sob clique com anterior/próxima, contador e teclado. Não misturar unidades.
