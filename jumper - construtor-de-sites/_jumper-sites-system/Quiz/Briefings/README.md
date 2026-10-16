# Formulário de briefing Jumper

Entrada pública dos modelos M1–M5. O servidor grava na base Notion configurada por `NOTION_TOKEN` e `NOTION_DATABASE_ID`; não cria automaticamente pastas de clientes ou tarefas Atlas.

## Desenvolvimento e testes

```sh
npm run serve:local
npm run check
npm test
```

O preview local usa a porta 4177. Variáveis precisam estar no ambiente do processo; o servidor Node não carrega arquivos .env automaticamente. Para só conferir o visual não precisa de token; envio real precisa de conexão autorizada. Não exponha segredos no frontend ou Git.

## M5

Site personalizado com escolha entre criação e reformulação. O perfil audiovisual recebe perguntas condicionais sobre páginas, destaques em vídeo, reprodução/celular, obras e créditos, prêmios/artes, Bio/foto e links profissionais. Site anterior e preservação/exclusão são pedidos somente na reformulação. O contrato técnico e a aprovação continuam em `../../_doc-mestre/M5-REFORMULACAO.md`.

Novos payloads usam `project_scope.custom_version = m5-v2`, `project_type` e `custom`; reformulação também usa `reformulation`. Entradas antigas continuam compatíveis. O Notion preserva JSON/Markdown completos e campos de consulta para o novo escopo; não criar registros relacionados ou estrutura de cliente automaticamente.

## Publicação

URL oficial: https://site.jumper.dev.br/briefing/ . A interface e a API `/briefing/api/briefings` são entregues pelo Worker `jumper-hoster`. A API chama o Notion diretamente pelo mesmo `notion-client.mjs`, com `NOTION_TOKEN` como segredo e `NOTION_DATABASE_ID` na configuração da Cloudflare. Não usar a Vercel como intermediária e não publicar a alteração antes de verificar a credencial do Notion.

A construção/publicação do pacote segue os scripts e preflights do Hoster, a partir de checkout limpo do GitHub main, preservando páginas e bindings ativos. O schema Notion deve incluir as propriedades M5 novas antes de ativar o formulário. Testes locais usam Notion simulado; nenhum segredo ou dado real pode entrar em fixtures. O arquivo `vercel.json` e APIs legadas ficam apenas para compatibilidade histórica e não são a etapa de publicação deste fluxo.

## Entrada guiada (14/09/2026)

M1: 12 etapas; M2–M4: 13. M5 usa 15 etapas na criação e 16 na reformulação; o perfil audiovisual acrescenta duas etapas. A versão `briefing_depth: strategic-v3` recupera público/necessidade/benefício, diferencial, oferta detalhada/preços/CTA, história/provas, referências e inventário inicial M5. Galeria, equipe, publicações e agendamento exibem detalhes conforme modelo/decisão. “Quero orientação” vira pendência da Jumper. M1 permanece uma página; M2 não ganha páginas extras por marcar recursos. M5 exige páginas, conteúdo por página e recursos; na reformulação exige também URL, motivo, preservação, retirada e funções existentes; inventário técnico e aprovação do escopo continuam obrigatórios antes de construir. Resumo lateral mostra respostas em tempo real e a última opção M5 ocupa a linha completa.

`intake_version: guided-v1` ativa validação dos dados essenciais na API. O payload canônico é preservado e acrescido de `production_handoff`, permissões de contato e imagens, e disponibilidade de materiais. O Notion conserva JSON e Markdown completos, além das colunas `Preferência de imagens IA` e `Disponibilidade de materiais` (select). Não tratar `nao-sei` como autorização, material ausente como pronto, ou pedido como escopo aprovado. Ler `_doc-mestre/FORMULARIO-GUIADO.md` para a passagem à produção.

Rascunho salvo no navegador e exportável em JSON para outro aparelho. O arquivo importado é filtrado por campos conhecidos e exige nova confirmação. Rascunhos legados são migrados, com novas permissões pendentes. Não há sincronização entre aparelhos sem exportação/importação. O botão de envio é bloqueado durante a requisição e depois da confirmação; em falha de conexão o cliente mantém as respostas e deve conferir com a Jumper antes de reenviar. `submission_id` é identificador de rastreio; não existe deduplicação transacional no servidor.

A entrada guiada foi publicada e validada no deployment `dpl_4TBynkQrXPwn5rQrEBrXjWWiXeuP`. Evidências e reversão: `../../_doc-mestre/FORMULARIO-GUIADO.md`.


## Revisão editorial da entrada

`strategic-v3` acrescenta evidência concreta do diferencial, dúvidas/respostas do público, processo de atendimento/compra, valores condicionais e finalidade da segunda página M2. Link público de agendamento funciona também no M1. A chamada de recuperação do endereço antigo foi removida; exportação/importação de rascunhos permanece disponível.

`content-review.mjs` gera uma triagem editorial no servidor. `production_handoff.content_review` é sempre `needs_editorial_review`; o servidor substitui qualquer aprovação recebida do formulário. Alertas de ausência, texto amplo ou dúvida não são avaliação automática de veracidade. JSON, Markdown e pendências do Notion incluem a triagem e os novos campos. O prompt oficial exige complementação de fatos essenciais e revisão da especificidade antes de construir. Não usar exportação apenas das colunas do Notion como substituto dos blocos completos.
