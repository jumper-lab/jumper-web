# Integração do Construtor com o Atlas

Implementação local em 08/09/2026. **Não publicada nem ativada em produção.**
Constituição conferida: https://app.notion.com/p/3bbdb6094968818bba38d59c8be5d913.

## Fluxo disponível

1. O formulário mantém a entrada na base existente do Construtor (o ID foi preservado na mudança para Atlas).
2. A equipe confere a Conta na entrada e escolhe a tarefa existente dessa mesma Conta.
3. `atlas:plan` verifica os registros e mostra o plano, sem gravar.
4. Com `--apply`, cria somente um Documento do tipo Briefing e status rascunho, com Conta, Tarefa de origem, Data, Link da origem e snapshot dos dados recebidos. As relações inversas são as já existentes no Atlas.

Não cria Conta, Organização, Produto, Projeto ou Tarefa; não altera status, responsáveis, prazos, fórmulas, propriedades ou visualizações. Não cria Atualizações: a identidade Executor-IA ainda precisa de definição compatível com a taxonomia existente. Não interpreta o conteúdo do cliente como instruções executáveis. Não inicia builds ou deploys.

## Execução

Configure `NOTION_TOKEN` no ambiente com a conexão autorizada. Nunca compartilhe a chave em conversa ou Notion. A conexão precisa ler Construtor, Contas, Tarefas e Documentos e inserir documentos. O conector do assistente não fornece automaticamente uma credencial ao projeto.

```sh
node _jumper-sites-system/scripts/atlas-briefing.mjs --briefing ID_DA_ENTRADA --task ID_DA_TAREFA
node _jumper-sites-system/scripts/atlas-briefing.mjs --briefing ID_DA_ENTRADA --task ID_DA_TAREFA --apply
node --test _jumper-sites-system/scripts/tests/atlas-briefing.test.mjs
```

Execute esses comandos dentro de `jumper - construtor-de-sites/`, com Node.js 20 ou superior. Use UUIDs, não URLs. Execute um processo por vez. A rotina é assistida por comando; não há agendamento, webhook nem chamada automática pelo formulário. A entrada pública não pode escolher IDs internos de Conta ou Tarefa.

## Proteções

- Confere o pertencimento às bases oficiais e o schema de Documentos antes de gravar.
- Exige uma única Conta com Organização, Produto, Dono e status Ativa/Onboarding. Confere a mesma âncora única na tarefa.
- Se já há documento com Link da origem, reutiliza; se há outro Briefing na Conta, para para revisão de versão. Isso também protege integrações antigas que usavam menções no corpo.
- Não repete automaticamente escritas que falharam. Em timeout, confira no Notion antes de repetir. A API não oferece aqui transação entre consulta e criação: não rodar workers concorrentes nem prometer idempotência global.
- Recusa conteúdo aninhado, JSON dividido incompleto e snapshots maiores que uma criação única. Mantém a origem intacta para revisão.
- `Data` usa `created_at` do formulário quando disponível. Nas entradas nativas/manuais, usa criação na origem e registra que isso não comprova envio pelo cliente. A coluna existente “Recebido em” permanece intacta.
- Anexos pesados continuam na origem/Drive. URLs temporárias de arquivos não equivalem a cópias permanentes.

## Situação real observada

Casa Beliê já tem documento rascunho e tarefa relacionados. O importador não deverá criar outro automaticamente. Rodeio já tem documento, mas sua Conta está sem Produto; exige regularização humana. Entradas sem Conta não passam. Nenhum registro de teste foi inserido no Atlas durante o desenvolvimento.

## Validação e ativação

19 testes locais de integração com transporte simulado passaram, além da verificação sintática do projeto. Os testes rodam pelo workflow dedicado `.github/workflows/atlas-briefing.yml` na raiz do repositório. Não são prova de autorização do token ou de publicação.

Para ativar: identificar o formulário e ambiente realmente utilizados, configurar a conexão nesse ambiente, executar o plano com um registro real validado e revisar o resultado antes da primeira criação. O site/formulário publicado permanece como estava até essa ativação.

A rotina usa a API Notion 2025-09-03 (`data_sources`); a entrada legada mantém sua versão para limitar a mudança. Referência: https://developers.notion.com/docs/upgrade-guide-2025-09-03.

## Retorno à versão anterior

As alterações locais limitam-se ao importador/testes, comandos npm, documentação, validação de entrada e mensagem de sucesso. O Atlas não sofreu migração de estrutura. Para retirar a rotina, deixe de executar o comando; não exclua documentos históricos. Não use reset amplo do repositório, que já contém mudanças anteriores de outros trabalhos.

## Teste real do formulário publicado — 08/09/2026

Submissão feita pela interface https://briefing-formulario-sites-jumper.vercel.app/.
Registro único confirmado às 18:26 (America/Sao_Paulo):
https://app.notion.com/p/3d5db609496881ba96e6e35aa619c8ab.
Nome: “TESTE INTEGRAÇÃO ATLAS — 2026-09-08 — NÃO PRODUZIR”. Conta vazia, dados fictícios, sem criação de trabalho comercial. Confirma chegada à base existente já movida para Atlas; não comprova ativação do importador de Documentos.

O teste também revelou que checkboxes de etapas anteriores eram apagados ao avançar (incluindo confirmação M1 e integrações). Correção incluída em quiz.js: atualizar somente grupos presentes na etapa atual, preservando a possibilidade de desmarcar todos. Teste de regressão incluído. A mensagem de sucesso antiga também foi corrigida no código. Essas correções dependem do deploy do formulário para chegar à produção.
