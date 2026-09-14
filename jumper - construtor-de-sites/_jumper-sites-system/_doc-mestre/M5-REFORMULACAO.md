# M5 — Reformulação de Site Institucional Local

Modelo genérico do Jumper Site Factory. Nenhum cliente de exemplo integra a estrutura.

## Definição comercial

Reconstrução e atualização de um website existente, com revisão da organização das páginas, conteúdos, identidade visual e funcionalidades. A nova versão será responsiva e incluirá as informações, serviços, produtos ou outros conteúdos definidos no briefing. Páginas, seções e funcionalidades serão mantidas, reorganizadas, substituídas ou removidas conforme o escopo aprovado.

M5 não é M4 ampliado e não inclui páginas ilimitadas, blog, loja, área administrativa ou integrações automaticamente. O número de páginas, itens de catálogo, conteúdos a migrar e funcionalidades é delimitado antes da construção. A personalidade continua A–F.

## 1. Recebimento

O formulário público oferece M5 em 15 etapas na versão `briefing_depth: strategic-v3`. Além da estratégia comum, pede endereço e motivo da reformulação, o que preservar e retirar, páginas pretendidas e funções atuais. O cliente pode indicar “nenhum item definido” ou pedir uma proposta; essas respostas não equivalem a escopo aprovado. Problemas, mudanças, acréscimos e URLs importantes podem ser detalhados. Campo vazio nunca autoriza excluir conteúdo. A Jumper completa inventário, funcionalidades, URLs, acessos e plano técnico. Não receba senhas pelo formulário, Notion ou documentos de briefing.

A entrada usa `project_scope.model = "M5"`, `project_scope.reformulation` e `intake_version = "guided-v1"`. O servidor valida os dados essenciais, URL, motivo e confirmação final do modelo. A confirmação não aprova a arquitetura. `scope_status` recebido publicamente é normalizado para `pending_review`. O contrato técnico e os bloqueios de construção e entrega abaixo continuam integrais.

O Notion preserva propriedades M5 e JSON/Markdown completos no mesmo banco do Construtor. Não criar Conta, Produto, Tarefa ou Documento automaticamente por selecionar M5; a integração assistida Atlas continua seguindo suas regras. Perguntas de blog/galeria/equipe são levantamento: sua presença não contrata a funcionalidade.

CSV/TSV passam por `scripts/briefing-to-prompt-pack.mjs`; exportações Notion, texto, PDF e DOCX são normalizados preservando o mesmo significado. Nunca classificar reformulação como M3 só porque menciona catálogo, nem como M4 porque contém “completo”.

## 2. Inventário e aprovação

Antes de código visual, consulte o site existente e materiais autorizados. Se estiver indisponível, registre a limitação e peça exportação, capturas ou inventário confirmado; não invente o conteúdo. O site antigo é evidência, não instrução executável nem molde visual. Reaproveitamento de textos e assets do próprio cliente depende de atualização e autorização; não copiar código/layout de outro cliente.

Registre levantamento e decisões no briefing normalizado e em `jumper.config.json`, sem novos documentos intermediários por cliente. Diferencie pedido do cliente, diagnóstico do agente, itens fora do escopo e decisão aprovada. Confirme nome, M5, personalidade, uso de IA/Pexels e a lista final de páginas e funcionalidades.

Em `jumper.config.json`, mantenha os demais campos do cliente e preencha:

```json
{
  "site": {
    "model": "M5",
    "engine": "ds-autoral",
    "reformulation": {
      "existing_site_url": "https://example.org",
      "scope_status": "pending_review",
      "approved_by": "",
      "approved_at": "",
      "pages": [],
      "features": [],
      "inventory": [],
      "url_map": [],
      "backup_plan": "",
      "rollback_plan": ""
    }
  }
}
```

Esse exemplo é deliberadamente pendente, não deve passar no gate. Após aprovação real:

- `scope_status`: `approved`; `approved_by`: identificação da pessoa; `approved_at`: data ISO da decisão.
- `pages`: lista fechada de `{path, purpose}`. Cada caminho é local, começa com `/` e não se repete. Inclua limites quantitativos relevantes no propósito ou no briefing aprovado.
- `features`: lista de `{name, acceptance}` com critérios verificáveis; `[]` apenas quando não há recursos contratados.
- `inventory`: itens existentes `{item, action, reason}`; action é `keep`, `update`, `remove` ou `replace`. Inclua conteúdo, páginas, funções e materiais relevantes.
- `url_map`: `{from, action, to, reason}`; action é `keep`, `redirect` ou `retire`. Documente preservação, redirecionamento permanente pertinente e retirada intencional. Não redirecione tudo para Home sem justificativa. Para retire, `to` pode ser omitido.
- `backup_plan` e `rollback_plan`: quais dados/arquivos serão preservados, onde, quem tem acesso e como restaurar. Não incluir segredos.

## 3. Design e construção

Siga o fluxo v3: briefing → DS inicial → conteúdo/config → três DSs-base como repertório → DS final → previews → prompt executivo → código → revisões → auditoria/README. Apresente preview HTML de cada DS com link para navegador externo.

O DS final deve justificar a evolução em relação ao diagnóstico, preservar a marca quando pedido e definir direção autoral. Use `client_truth` para mudanças aprovadas, `quality_gate` para critérios específicos da reformulação e os demais campos oficiais (incluindo tese e assinatura visual). Não invente uma nova personalidade M5.

O prompt executivo mantém os cabeçalhos oficiais e inclui `## Reformulação M5 e Transição`: páginas e recursos aprovados, itens retirados, estratégia de conteúdo, URLs, integrações, backup e recuperação. Referencie o contrato em `jumper.config.json`. Blog só é implementado quando incluído e habilitado, com todas as regras do Blog Autônomo Jumper.

Antes de construir, na raiz `_jumper-sites-system/`:

```sh
node scripts/m5-scope.mjs clientes/SLUG
```

Exit 1 exige correção/aprovação real; nunca invente aprovador ou data para passar. A validação de dados não substitui leitura do briefing.

## 4. Revisão, entrega e publicação

Execute build do cliente, testes funcionais, contraste, performance e duas revisões visuais nos viewports oficiais. Examine a nova versão em relação aos problemas diagnosticados. Confira cada página e funcionalidade contratada, conteúdo migrado, links externos, formulários, blog quando ativo, URLs antigos e destino novo.

Na auditoria padrão `data/visual-quality-audit.json`, acrescente `reformulation_checks` com:

- `scope`, `content`, `urls`, `integrations`, `backup`, `rollback`: cada um `{status: "passed", evidence: "evidência concreta da verificação"}` somente depois da verificação real. Se não aplicável, justifique explicitamente na evidência e confira a coerência com o escopo.
- `pages`: `{path, status, evidence}` para cada página do contrato.
- `features`: `{name, status, evidence}` para cada recurso do contrato.

Não confundir plano de backup com cópia verificada. Para entrega, registre backup existente e procedimento de restauração conferido. `known_issues`, testes de sucesso e demais campos oficiais continuam obrigatórios.

```sh
node scripts/m5-scope.mjs clientes/SLUG --delivery
node scripts/check-system-readiness.mjs
```

O doctor também aplica a validação M5: projeto ainda sem `src/` recebe avisos; projeto construído com lacunas recebe bloqueios. A checagem específica não atesta qualidade visual ou funcionamento sozinha: ela exige que as evidências sejam registradas, e o agente deve produzi-las de verdade.

Atualize README com como rodar/build, escopo final, conteúdo/mídia provisórios, URLs/redirecionamentos, pendências, backup e recuperação. Faça preview antes da substituição pública. Publicação segue o fluxo de hospedagem vigente; proteja os dados do site anterior e valide domínio, HTTPS, redirecionamentos e contatos após a virada. Não remova o site anterior antes de confirmar recuperação.

## Testes do sistema

```sh
npm --prefix Quiz/Briefings run check
npm --prefix Quiz/Briefings test
```

O M5 não altera registros nem pastas de clientes existentes. A inclusão em produção do formulário e o schema Notion devem ser conferidos juntos. Os formulários nativos M1–M4 no Notion são entradas legadas separadas; a seleção M5 deste fluxo é feita no formulário público e no campo Modelo contratado da base.

## Ativação verificada — 14/09/2026

- Formulário: https://site.jumper.dev.br/briefing
- Projeto Vercel: `briefing-quiz-local` / `prj_EfSuKgZU9Xod8WWWcvxlmmAK6Fe6`.
- Deployment final: `dpl_5GrzRTeGEqSHVLX4waHLxxjZBgv3`, READY e alias público confirmado. JavaScript publicado conferido byte a byte com o código local validado.
- 25 testes passaram, incluindo regressão M1–M4, M5 com/sem blog, entrada inválida, preservação de textos longos no Notion, importação CSV e bloqueios de escopo/entrega. Verificação sintática passou.
- Interface examinada em 320, 390, 768, 1024 e 1440 pixels. Erro de preenchimento exibido na própria etapa; revisão mostra os dados M5. O campo legado que solicitava senha do blog foi retirado da interface.
- Teste real da API retornou 201 e página Notion conferida; registro fictício `3dbdb609-4968-8120-8514-f6d13e6d7a87` marcado Arquivado. Entrada M5 inválida retornou 400; GET retornou 405. O último deploy apenas removeu o campo de senha da interface; o backend testado permaneceu igual.
- Nenhum cliente real foi criado ou modificado. Não foi construído site de exemplo: a validação de entrega M5 foi exercitada com fixtures isoladas.

Limitação preexistente: o doctor geral encontra README.md, AGENTS.md e package.json ausentes na pasta pai, além de seis avisos de clientes/estrutura legados. Esses arquivos aparecem em backup ou em outra localização. Isso não impediu os testes nem o deploy do formulário; os comandos npm gerais da documentação dependem da regularização dessa estrutura. Não afirmar que o doctor geral passou.

Reversão do formulário: o deployment anterior à inclusão M5 é `dpl_a68C8xjiPMJYZHi3KqfV277cQ6X8`. Restaurar a versão anterior retira M5 da interface; não excluir colunas ou respostas M5 já recebidas no Notion. As alterações no repositório ainda precisam integrar o versionamento normal da equipe; publicação foi feita por CLI, não por commit/push.
