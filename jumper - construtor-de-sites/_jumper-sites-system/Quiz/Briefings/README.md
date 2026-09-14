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

Reformulação de Site Institucional Local com levantamento do site existente e escopo pendente de revisão. A confirmação do modelo não substitui aprovação da arquitetura. Regras e contrato completos em `../../_doc-mestre/M5-REFORMULACAO.md`.

O Notion recebe campos M5 e blocos completos `JUMPER_PAYLOAD_JSON_PART` e `JUMPER_NORMALIZED_BRIEFING_MD_PART`. A interface recebe links de materiais ou registra envio posterior/reaproveitamento do site atual. Não oferece upload de materiais que apenas salva nomes; o arquivo JSON de rascunho serve exclusivamente para retomar respostas. Senhas são configuradas pelo servidor, não coletadas no briefing.

## Publicação

URL pública oficial: https://site.jumper.dev.br/briefing . A interface e o endpoint público são entregues no domínio da Jumper. A rota técnica de compatibilidade `https://quizzer.jumpers.cloud/briefing-novo-site` usa os mesmos arquivos e o mesmo processamento, mas não deve ser divulgada nem usada em novos links. A interface deste diretório é a fonte; sincronize-a no Quizzer com `node scripts/sync-site-briefing.mjs /caminho/Quiz/Briefings` antes de publicar pelo comando oficial `bun run deploy:production`.

O projeto Vercel `briefing-quiz-local`, conta `jumper-studios-projects-2fd4229e`, conserva o processamento Notion e as variáveis Production. Não remover o backend nem redirecionar as APIs: os dois endereços públicos encaminham ao mesmo processamento. Novos links devem apontar para `https://site.jumper.dev.br/briefing`.

Mudança de domínio e evidências: `../../_doc-mestre/MIGRACAO-URL-FORMULARIO.md`. O fluxo assistido Atlas permanece documentado em `../../_doc-mestre/INTEGRACAO-ATLAS.md` e não é acionado automaticamente por uma submissão.

## Entrada guiada (14/09/2026)

M1: 12 etapas; M2–M4: 13; M5: 15. A versão `briefing_depth: strategic-v3` recupera público/necessidade/benefício, diferencial, oferta detalhada/preços/CTA, história/provas, referências e inventário inicial M5. Galeria, equipe, publicações e agendamento exibem detalhes conforme modelo/decisão. “Quero orientação” vira pendência da Jumper. M1 permanece uma página; M2 não ganha páginas extras por marcar recursos. M5 exige URL, motivo, preservação, retirada, páginas pretendidas e funções existentes; inventário técnico e aprovação do escopo continuam obrigatórios antes de construir. Resumo lateral mostra respostas em tempo real e a última opção M5 ocupa a linha completa.

`intake_version: guided-v1` ativa validação dos dados essenciais na API. O payload canônico é preservado e acrescido de `production_handoff`, permissões de contato e imagens, e disponibilidade de materiais. O Notion conserva JSON e Markdown completos, além das colunas `Preferência de imagens IA` e `Disponibilidade de materiais` (select). Não tratar `nao-sei` como autorização, material ausente como pronto, ou pedido como escopo aprovado. Ler `_doc-mestre/FORMULARIO-GUIADO.md` para a passagem à produção.

Rascunho salvo no navegador e exportável em JSON para outro aparelho. O arquivo importado é filtrado por campos conhecidos e exige nova confirmação. Rascunhos legados são migrados, com novas permissões pendentes. Não há sincronização entre aparelhos sem exportação/importação. O botão de envio é bloqueado durante a requisição e depois da confirmação; em falha de conexão o cliente mantém as respostas e deve conferir com a Jumper antes de reenviar. `submission_id` é identificador de rastreio; não existe deduplicação transacional no servidor.

A entrada guiada foi publicada e validada no deployment `dpl_4TBynkQrXPwn5rQrEBrXjWWiXeuP`. Evidências e reversão: `../../_doc-mestre/FORMULARIO-GUIADO.md`.


## Revisão editorial da entrada

`strategic-v3` acrescenta evidência concreta do diferencial, dúvidas/respostas do público, processo de atendimento/compra, valores condicionais e finalidade da segunda página M2. Link público de agendamento funciona também no M1. A chamada de recuperação do endereço antigo foi removida; exportação/importação de rascunhos permanece disponível.

`content-review.mjs` gera uma triagem editorial no servidor. `production_handoff.content_review` é sempre `needs_editorial_review`; o servidor substitui qualquer aprovação recebida do formulário. Alertas de ausência, texto amplo ou dúvida não são avaliação automática de veracidade. JSON, Markdown e pendências do Notion incluem a triagem e os novos campos. O prompt oficial exige complementação de fatos essenciais e revisão da especificidade antes de construir. Não usar exportação apenas das colunas do Notion como substituto dos blocos completos.
