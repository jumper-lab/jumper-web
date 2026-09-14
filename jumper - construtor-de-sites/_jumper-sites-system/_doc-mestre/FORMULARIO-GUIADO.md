# Formulário guiado — M1 a M5

A entrada pública recolhe informações que o cliente conhece. A Jumper completa o planejamento antes da produção. O formulário não é o documento final de escopo e sua conclusão não garante que todos os materiais foram entregues.

## Caminhos

| Modelo | Etapas | Particularidade |
| --- | --- | --- |
| M1 | 12 | Uma página com até 5 seções; conteúdo estratégico completo dentro desse limite. |
| M2 | 13 | Home + segunda página escolhida ou definida com a Jumper. Recursos devem caber no escopo contratado. |
| M3 | 13 | Galeria/catálogo com itens, quantidade aproximada e organização; materiais pendentes são identificados. |
| M4 | 13 | Estrutura institucional; blog, equipe, galeria e agendamento detalhados quando pertinentes. |
| M5 | 15 | Site atual, motivo, preservação, retirada, páginas desejadas e funções atuais; análise técnica e aprovação posteriores. |

Campos comuns: negócio, público e necessidades, benefício esperado, objetivo, diferencial, oferta detalhada, preços, ação principal, história, avaliações e autorização, atendimento, contato, estilo, referências e materiais. Perguntas condicionais solicitam detalhes quando o recurso é selecionado. Respostas curtas, indicação de materiais futuros e pedidos de orientação são válidos; não inventar informações para preencher. Data e observações são opcionais. Não pedir SEO, DNS, pixels, arquitetura técnica ou senhas ao cliente.

O painel lateral exibe respostas em tempo real, com avanço como informação secundária. No celular pode ser recolhido. A grade de cinco modelos ocupa toda a largura da última linha, sem célula vazia cinza.

## Complementação obrigatória pela Jumper

1. Ler respostas completas e `production_handoff.pending_decisions` no JSON/Markdown do briefing Notion. Confirmar dados, público, objetivo/CTA, posicionamento, páginas e limites do modelo. Não transformar “não sei”, branco ou detalhe oculto em decisão aprovada.
2. Organizar conteúdo e receber materiais acessíveis. Confirmar itens da galeria, equipe, oferta/preços, depoimentos autorizados, posts iniciais, endereço e horários pertinentes. Sem material, registrar pendência e combinar entrega. Não inventar fatos, avaliações, pessoas, prêmios ou resultados.
3. Respeitar `operations.contact_publication`. Contato privado do responsável serve à condução do projeto; só publicar com `sim`. Em `outro`, usar `operations.public_contact` após conferir; em `depois`, obter confirmação. Conferir canal e destino de formulários e agendamentos.
4. Respeitar `assets.ai_placeholder_permission` e `project_scope.pexels_mode`. IA autorizada é criada para aprovação antes da publicação. Banco em `fallback` só entra quando faltar material adequado. “Quero orientação” não autoriza nenhum dos dois. Logo, retratos, produtos e informações reais precisam de evidência e autorização.
5. Resolver domínio, hospedagem, acessos por canal adequado, integrações, métricas e requisitos de privacidade pertinentes ao projeto. Preparar SEO, acessibilidade, desempenho e comportamento móvel. Aprovar o escopo antes de construir.
6. Para M5, analisar o site atual, inventariar páginas/conteúdo/recursos/URLs e definir preservação, mudanças, exclusões, backup e recuperação. Seguir integralmente `M5-REFORMULACAO.md` e `scripts/m5-scope.mjs`; a entrada do cliente não dispensa esses controles.
7. Gerar conteúdo, DS e implementação pelos prompts oficiais. Verificar contatos, links, formulários, integrações, blog quando contratado, responsividade e materiais aprovados antes da entrega. Registrar pendências que impeçam publicação.

## Persistência e integração

O fluxo usa `intake_version = guided-v1` e `briefing_depth = strategic-v3`; mantém o payload canônico e adiciona o encaminhamento à produção. Campos condicionais desativados não seguem como conteúdo ativo. O servidor valida conteúdo estratégico e detalhes condicionais da versão `strategic-v3` (mantendo a validação de `strategic-v2`), aceita a versão guiada anterior de abas já abertas e mantém M5 em `pending_review`.

A base do Construtor no Jumper Atlas recebe propriedades e blocos completos `JUMPER_PAYLOAD_JSON_PART` / `JUMPER_NORMALIZED_BRIEFING_MD_PART`. As propriedades `Preferência de imagens IA` e `Disponibilidade de materiais` complementam a visualização. Campos vazios da base podem ser itens a complementar, não falha de gravação. O formulário não cria contas, tarefas ou documentos automaticamente.

O rascunho é local ao navegador. Para outro aparelho, exportar e importar JSON. Não existe sincronização automática. A confirmação final é exigida antes do envio. Falhas preservam as respostas; uma resposta de rede incerta exige conferir se o registro chegou antes de repetir.

## Histórico — primeira versão guiada em 14/09/2026

- A versão inicial guiada foi publicada na Vercel no deployment `dpl_4TBynkQrXPwn5rQrEBrXjWWiXeuP`, projeto `briefing-quiz-local`, conta `jumper-studios-projects-2fd4229e`.
- Verificação sintática e 32 testes aprovados. Caminhos M1–M5 percorridos no navegador, incluindo campos condicionais, revisão obrigatória, limpeza de dados desativados, falha de envio, bloqueio de requisição simultânea, retomada após recarregar e importação de arquivo de rascunho.
- Interface conferida entre 320 e 1440 pixels; corrigidos transbordamento de arquivo na primeira etapa e descrições escondidas por estilos legados em telas pequenas. HTML, JS e CSS públicos conferidos byte a byte com os arquivos finais. API pública rejeitou entrada inválida com HTTP 400.
- Envios reais dos cinco modelos conferidos na base `370db609496880e28cbfce7472169134` (data source `370db609-4968-80f0-9a18-000b646e806e`) do Construtor no Jumper Atlas. Verificados materiais com link, envio posterior, reaproveitamento, consentimento/recusa/dúvida de IA, catálogo M3, blog M4 e M5 pendente. Os cinco primeiros envios ocorreram no deployment de validação `dpl_9ktLKp1f2EiwaVTQQ55xufPtn94V`; o envio adicional abaixo confirmou o deployment final pelo navegador público.
- Registros técnicos: M1 `3dbdb609-4968-814b-a24c-de30956bf5ec`; M2 `3dbdb609-4968-816b-a47a-e38a7789c746`; M3 `3dbdb609-4968-814b-8ddf-ca863dd7f2f2`; M4 `3dbdb609-4968-812e-a7a4-eb51f184d72a`; M5 `3dbdb609-4968-81ac-bc21-c8916a82e904`.
- Verificação adicional pelo botão Enviar do formulário público: M5 `3dbdb609-4968-817c-ae12-e6f24bc5cf0f`. Recebimento confirmado, `pending_review`, permissões, materiais, pendências e blocos completos conferidos. Recarregar manteve a confirmação de recebimento.
- Os seis registros sintéticos foram marcados com Status `🗄️ Arquivado`; não excluídos. Nenhuma conta, tarefa ou site foi criado por esses testes. Não representam clientes reais nem regras de modelo.
- Reversão para a versão anterior à entrada guiada: deployment `dpl_5GrzRTeGEqSHVLX4waHLxxjZBgv3`. Preservar colunas e respostas do Notion. A publicação ocorreu via CLI; alterações locais ainda seguem o versionamento normal da equipe.

Os testes verificam comportamento e integração; não medem taxa de abandono. A completude do projeto depende da complementação pela Jumper e das aprovações acima.


O endereço público oficial é https://site.jumper.dev.br/briefing . A rota técnica `https://quizzer.jumpers.cloud/briefing-novo-site` permanece compatível com os mesmos arquivos e processamento, mas não deve ser divulgada. Hospedagem, conexões e evidências: [MIGRACAO-URL-FORMULARIO.md](MIGRACAO-URL-FORMULARIO.md).

## Revisão de profundidade e interface — 14/09/2026

- Publicada `strategic-v2`: resumo de respostas restaurado, M5 ocupando a última linha inteira e perguntas estratégicas comuns/condicionais explícitas. Rascunhos e integração anterior preservados.
- 34 testes do Construtor e 5 do transporte Quizzer passaram. M1–M5 percorridos no navegador com transporte simulado; layout conferido em 320, 390 e 1440 px, sem transbordamento horizontal. Resumo responde ao preenchimento, confirmação final obrigatória e dados de módulos desativados não seguem ativos.
- Dois envios reais M5 no novo endereço confirmados na base Atlas: `3dbdb609-4968-8117-ae9e-eabbe644d31c` e `3dbdb609-4968-8112-9f00-f444374844ba`. Ambos com Status `🗄️ Arquivado`. O segundo também confirmou catálogo, equipe, blog e autorização pendente no JSON e no Markdown normalizado. Recarregar após o envio conserva a confirmação de recebimento.
- Worker Quizzer: `bd07a9e5-6f35-4236-8823-47877a5938e3`, publicado pelo comando oficial. Verificador de rotas e evento Supabase passou.
- Backend Notion final: `dpl_Gge3JxUfBrqde9xUvFsMuaWALRRc` (`briefing-quiz-local-hi5r4hyng-jumper-studios-projects-2fd4229e.vercel.app`). Validação estratégica é restrita ao marcador novo; formulários guiados anteriores continuam aceitos. Markdown agora explicita conteúdo por modelo e permissões, além do JSON completo.
- Lint dos arquivos do transporte passou. Lint global do Quizzer continua apontando o erro de formatação preexistente em `src/onboarding/submit.ts:6` e seis avisos de Fast Refresh de componentes compartilhados; não são introduzidos pelo formulário.
- Reversão da interface: Worker `51c4852c-579e-42b6-b5e5-a254c55c27e2`. Backend anterior: `dpl_GkjhkDryWfk4wN7AWERejtRL56dr`. Não remover respostas ou colunas do Notion ao reverter.


## Revisão editorial strategic-v3

A versão atual exige exemplo do diferencial, dúvidas reais, processo de atendimento e conteúdo específico da segunda página, além de preços condicionais. A confirmação é invalidada ao alterar respostas. O link de recuperação do endereço antigo foi removido. Auditoria, contrato de conteúdo e evidências: [REVISAO-QUALIDADE-BRIEFING.md](REVISAO-QUALIDADE-BRIEFING.md).
