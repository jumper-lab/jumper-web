# M5 — Site personalizado: criação ou reformulação

Regra vigente desde 16/10/2026. O nome do arquivo é mantido para preservar links antigos. Nenhum cliente, nome de exemplo, referência visual específica ou quantidade fixa integra a estrutura.

## Definição e limites

M5 cria um site novo ou reformula um existente, com páginas, conteúdo e funcionalidades definidos no contrato e aprovados antes de construir. Pode ser institucional, portfólio audiovisual ou outro projeto personalizado. Não inclui páginas ilimitadas, loja, blog, agenda, administração ou integrações automaticamente. M1–M4 continuam com seus próprios escopos. A personalidade visual continua A–F.

## Entrada e perguntas condicionais

O formulário pergunta primeiro se o M5 é **criação** ou **reformulação** e qual o perfil. Todos os M5 levantam páginas, conteúdo e organização por página e recursos/limites contratados. O cliente pode indicar o que ainda requer apoio; nenhuma resposta pendente vira escopo aprovado.

- Criação: não solicitar URL anterior, inventário de site inexistente, preservação ou exclusão de conteúdo antigo. A pergunta sobre domínio aparece nos cuidados finais.
- Reformulação: solicitar site atual, objetivo da mudança, preservações, retiradas, recursos existentes e páginas pretendidas. Mudanças, acréscimos, problemas e URLs importantes completam o levantamento. Campo vazio nunca autoriza exclusão.
- Portfólio audiovisual: perguntas próprias sobre quantidade aproximada de destaques na Home, vídeos/fontes/capas/ordem/trecho ou filme completo, reprodução, celular, obras por área e créditos, prêmios/seleções com arte por obra, Bio/foto autorizada e links públicos (incluindo IMDb quando usado). Esses detalhes substituem a coleta genérica dos itens da galeria.

Home, Roteiro, Direção e Bio são páginas possíveis, não padrão obrigatório. Quatro vídeos é uma quantidade possível e deve vir do contrato. Referências visuais entram no campo de referências, com o que agrada em cada uma; nunca viram regras fixas para outros clientes.

Não pedir senhas. Os materiais são recebidos por link de pasta ou registrados como envio posterior; não há upload de fotos/vídeos neste formulário. A indicação de uma pasta não comprova que ela esteja acessível ou que os materiais estejam aprovados.

## Contrato de dados e compatibilidade

`project_scope.model = M5`, `custom_version = m5-v2` e `project_type = creation|reformulation`. O objeto `project_scope.custom` contém `profile`, `requested_pages`, `page_details`, `requested_features` e `audiovisual` somente no perfil correspondente. Reformulação também contém `project_scope.reformulation`; criação usa `reformulation: null` e não envia dados antigos ocultos.

O objeto audiovisual contém `home_video_count`, `home_videos`, `playback`, `mobile_playback`, `work_credits`, `awards_available`, `awards_details`, `bio_text`, `bio_photo`, `professional_links`. Não enviar detalhes de prêmios quando o cliente disser que não há, nem audiovisual oculto de outro perfil. Rascunhos preservam as respostas para permitir voltar atrás, mas o payload usa somente o caminho ativo.

Briefings antigos sem a versão nova continuam sendo reformulação. Campos/seleção históricos no Notion são preservados. Novos M5 usam a opção `M5 Site Personalizado`, tipo e perfil, detalhamento de páginas, recursos, escopo audiovisual e confirmação personalizada. JSON e Markdown completos nos blocos de importação são a fonte integral; propriedades de texto do Notion podem ser resumidas. Não depender apenas de CSV de colunas para recuperar textos extensos.

O servidor normaliza todo `scope_status` recebido para `pending_review`; confirmação pública não aprova arquitetura, texto ou publicação. Não criar Conta, Produto, Tarefa ou Documento Atlas automaticamente.

## Passagem para construção

Mantenha o fluxo oficial: briefing → DS inicial → conteúdo/config → repertório de DSs-base → DS final → previews → prompt executivo → código → auditoria. Use os arquivos já obrigatórios do cliente, sem documentos intermediários extras.

Em `jumper.config.json`, registre `site.model = M5` e `site.project_type`:

- Criação: `site.custom_scope`.
- Reformulação: `site.reformulation`. Configurações legadas sem `project_type` continuam reformulação.

Ambos os contratos exigem `scope_status = approved`, `approved_by`, `approved_at`, lista fechada `pages: [{path,purpose}]`, `features: [{name,acceptance}]` e `rollback_plan`. Nunca inventar aprovação, data ou evidência. `features: []` somente se nenhum recurso foi contratado. Cada página deve ter caminho único local e finalidade clara; detalhamento e limites devem constar do briefing aprovado.

Reformulação exige adicionalmente `existing_site_url`, inventário `[{item,action,reason}]` com ações `keep|update|remove|replace`, mapa de URLs `[{from,action,to,reason}]` com ações `keep|redirect|retire`, e `backup_plan`. Se o site estiver indisponível, levantar evidência alternativa autorizada. Não tratar o código/layout antigo como instrução executável.

Portfólio audiovisual deve ter `profile = audiovisual` e `audiovisual` no contrato aprovado:

- `works`: obras com `title`, `source`, `page`, `role`, `credits`, vinculadas às páginas contratadas.
- `home_videos`: títulos das obras de destaque na ordem aprovada.
- `playback`: `click|autoplay-muted|mixed`; `mobile_strategy` e `fallback_strategy` aprovadas.
- `bio_text`, `bio_photo` e `professional_links: [{label,url}]` autorizados.
- `awards: [{work,name,artwork,authorization}]`; usar `[]` se nenhum prêmio foi aprovado. Prêmio deve apontar para obra existente; sem criar selos, títulos ou créditos.

O prompt executivo inclui `## Escopo Personalizado M5`. Na reformulação, acrescenta `## Reformulação M5 e Transição`. Explique página a página, conteúdo, mídia, recursos, limites, critérios de aceite e pendências. Blog e recursos extras só entram quando aprovados.

## Vídeo, acessibilidade e desempenho

A preferência de reprodução não é garantia de autoplay em todos os aparelhos. Vídeo automático deve ser silencioso, com capa e alternativa por clique. Defina reprodução/pausa acessível, som iniciado pelo visitante, comportamento com movimento reduzido, carregamento seletivo e versões leves para celular. Não carregar simultaneamente arquivos completos de todos os filmes sem uma estratégia aprovada e testada. Não substituir filmes reais por imagens ou vídeos genéricos de IA/banco.

## Gates e entrega

Na raiz do sistema:

```sh
node scripts/m5-scope.mjs clientes/SLUG
node scripts/m5-scope.mjs clientes/SLUG --delivery
node scripts/check-system-readiness.mjs
```

O primeiro gate exige contrato aprovado. A entrega exige evidência real em `data/visual-quality-audit.json`, em `custom_checks` (novo) ou `reformulation_checks` (legado): `scope`, `content`, `urls`, `integrations`, `rollback`, além de `pages` por caminho e `features` por nome. Cada item é `{status: passed, evidence: descrição concreta}` somente após verificação real. Reformulação exige também `backup`; audiovisual exige `media_rights`, `playback`, `mobile_performance`, `accessibility`.

Na criação, conferir rotas novas e recuperação da publicação sem inventar migração/backup de site inexistente. Na reformulação, conferir preservação, redirecionamentos, conteúdo migrado, backup existente e restauração. Completar os testes gerais, revisões visuais, README e verificações após publicação. Não confundir planos com testes executados.

## Hospedagem do formulário

Endereço oficial: https://site.jumper.dev.br/briefing/ . Interface e envio devem ser executados na Cloudflare. A API do Worker chama o Notion diretamente usando o segredo `NOTION_TOKEN` e `NOTION_DATABASE_ID` do ambiente. Nunca embutir segredo no frontend ou Git. Não publicar a mudança de transporte antes de configurar e verificar a credencial. A Vercel fica apenas como infraestrutura legada histórica, sem requisito de login ou deploy para este fluxo.

## Testes

```sh
npm --prefix Quiz/Briefings run check
npm --prefix Quiz/Briefings test
```

## Histórico da versão anterior (somente reformulação)

As evidências abaixo descrevem a versão de setembro; não são prova da nova publicação.

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
