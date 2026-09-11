# Casa Beliê — v3 (casa-belie-3)

Site M4 completo da Casa Beliê, casa de festas em Laranjeiras/RJ. Terceira versão, baseada na versão 2 e atualizada com o briefing “Site Beliê” recebido em setembro de 2026.

Esta versão preserva a identidade visual, as fotos reais e a estrutura técnica da v2, adicionando quatro formatos de evento, buffet detalhado, recreação completa, decoração inclusa, avaliações do Google e formulário de contato atualizado.

## Estado

- **Status:** construído, auditado, aguardando confirmações do cliente (ver Pendências).
- **Tese visual:** "o muro de pintura no site" — casa editorial calma com traços de giz que se desenham, anotações manuscritas e muro de memórias. Assinatura: **Traço Beliê**.
- **Stack:** Astro 5 em modo server + adapter Node (por causa do blog), vanilla JS, Google Fonts (Young Serif, Nunito Sans, Caveat).

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:4321 (ou --port 4666)
npm run build      # build de produção
npm run preview    # serve o build
```

## Blog Autônomo Jumper

- Painel: `/posts/` — pede senha antes de mostrar qualquer coisa.
- Senha: variável de ambiente `BLOG_ADMIN_PASSWORD`. O fallback local `belie2026posts` existe SOMENTE para preview local e deve ser sobrescrito com uma senha forte no ambiente de produção (defina a env var no host).
- Trocar senha: alterar `BLOG_ADMIN_PASSWORD` no ambiente e reiniciar o processo.
- Publicar/arquivar: no `/posts/`, editar a novidade e mudar o Status (Rascunho/Publicado/Arquivado). Só `published` aparece em `/blog/` e nas APIs públicas.
- Subir imagem: no editor, campo "subir imagem do computador" (jpg/png/webp/avif/gif, máx 8MB) → salva em `public/uploads/blog/` e preenche a capa; para usar no corpo: `<img src="/uploads/blog/arquivo.jpg" alt="descreva a foto">`.
- Dados: `data/blog-posts.json`. Posts 2 e 3 estão como rascunho para desenvolvimento com o cliente.

## Conteúdo provisório (sinalizado)

| Item | Valor atual | Ação antes do deploy |
| --- | --- | --- |
| WhatsApp | +55 21 99669-4990 | Confirmado no briefing v3 e no perfil do Google |
| Endereço | Rua General Glicério, 131 | Confirmar 131 vs 391 + CEP |
| E-mail | contato@casabelie.com.br | Confirmado no briefing v3 |
| Horário | "por agendamento" | Confirmar horário oficial |
| Fotos | Reais do @casabelie (baixadas do Instagram, recortadas) | Confirmar autorização de imagem das famílias/crianças + crédito dos fotógrafos (@gabiamorimfoto, @fe.bordallo etc.); pedir originais em alta |
| Fotos das fundadoras | Monogramas placeholder na seção "Quem abre a porta" | Solicitar retratos autorizados |
| Avaliações | Nota e contagem consultadas no Google em 10/09/2026 | Atualizar periodicamente antes de publicar |
| GA4/Pixel/Ads | Não instalados | Instalar com IDs do cliente (pontos `data-evt` prontos) |

## Estrutura

```txt
briefing/               briefing normalizado + payload + entrada
data/                   design systems, content, prompt executivo, auditoria, blog-posts.json
public/images/          assets locais (fotos provisórias + logo oficial)
public/uploads/blog/    uploads do painel
src/pages/              index, sobre, festas, espaco, contato, blog/, posts/, api/
src/components/         Header, Footer, HeroInterno, CtaFinal, Star
src/lib/blogStore.js    persistência e senha do blog
```

## Auditoria

Resultado dos três testes de sucesso, passes de revisão e `known_issues` honestos em [data/visual-quality-audit.json](data/visual-quality-audit.json). Resumo: pronto para apresentação com provisórios sinalizados; **não publicar** antes das confirmações da tabela acima.
