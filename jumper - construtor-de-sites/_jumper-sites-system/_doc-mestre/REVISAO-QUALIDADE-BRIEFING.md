# Revisão do briefing para conteúdo específico — 14/09/2026

A revisão abrange perguntas, condições, revisão final, payload canônico, registro Notion e instruções de construção. Não mede abandono nem garante a veracidade das respostas. Nenhum nome de cliente de exemplo foi incorporado ao modelo.

| Parte | Critério e correção |
| --- | --- |
| Modelo | M1 explicita até 5 seções; M2 mantém duas páginas; M5 depende do escopo aprovado. Sem chamada ao endereço antigo. |
| Negócio | Nome, descrição, público e área de atuação identificam a empresa. Atendimento presencial no cliente e remoto têm opções distintas. |
| Objetivo | Prioridade comercial e diferencial acompanhados de exemplo concreto. Adjetivos vagos exigem complementação editorial. |
| Público | Necessidade, benefício, dúvidas reais/respostas, restrições e mensagem obrigatória. Sem inventar problemas ou promessas. |
| Oferta | Itens, processo, condições, política de preços e ação principal. Valores são solicitados apenas quando serão exibidos; trocar a opção retira valores desativados do payload. |
| Provas | História, avaliações disponíveis, autorização, números e credenciais. Ausência de avaliações não autoriza inventar. |
| M2 | Segunda página pode ser outra prevista no contrato e tem finalidade/conteúdo próprios. Recursos não aumentam a quantidade de páginas. |
| M3 / galeria | Conteúdo orientado a produto ou caso de trabalho, quantidade, categorias, preços e materiais. Não presumir checkout. |
| M4 / blog | Temas, frequência, fornecimento/aprovação dos textos. Equipe solicita nomes, funções, experiência e fotos autorizadas. |
| M5 | Site, motivo, problemas, preservações, alterações, exclusões, acréscimos, páginas, funções e URLs. Inventário técnico e aprovação continuam obrigatórios. |
| Contato | Canal privado separado do público; verificar destino do CTA. M1 pode usar link externo de agendamento sem perder o endereço informado. |
| Estilo | Personalidade, cor, referências com motivos, estilo a evitar, tom e restrições. Não copiar referências ou reutilizar a identidade de outro cliente. |
| Materiais | Link, envio posterior ou reaproveitamento, inventário e permissões distintas para IA/banco. Conferir materiais antes de substituir por imagens genéricas. |
| Revisão | Novos campos aparecem antes de confirmar. Resumo ao vivo preservado. Campos obrigatórios identificados para tecnologias assistivas. |
| Entrega ao construtor | JSON e Markdown completos preservam dados novos e triagem. Não usar apenas CSV de propriedades do Notion como briefing completo. |

`strategic-v3` mantém as mesmas 12/13/15 etapas. São novos campos dentro das etapas pertinentes. Abas antigas `strategic-v2` e `guided-v1` continuam aceitas pelo servidor.

A triagem de `content-review.mjs` registra pendências e possíveis inconsistências, sempre em `needs_editorial_review`. Não aceita aprovação editorial fornecida pelo navegador e não transforma ausência de alertas em aprovação. O construtor deve complementar fatos essenciais, registrar fontes no documento executivo existente e revisar textos e direção visual pelo teste de troca do nome da empresa. Informações insuficientes não podem ser substituídas por conteúdo genérico.

## Evidências de publicação

- 39 testes do Construtor e 5 do transporte passaram. M1–M5 percorridos no navegador com envio simulado; M1 agendamento, M2 outra página/finalidade, preços condicionais, detalhes dos módulos, confirmação e limpeza de conteúdo inativo conferidos.
- Telas móveis de 320 e 390 px sem transbordamento horizontal. Confirmação anterior desmarcada ao alterar resposta, verificada também no navegador. O link solicitado não aparece na interface pública. JS público idêntico ao arquivo de origem.
- Worker final `8541eb7d-9ca7-444c-93e8-3a05748f1b3b`; backend `dpl_FMf6ELSnzUtDRNMBqfQw7Pc4Y8Kb`. Deploy oficial e verificador das rotas/registro técnico Supabase aprovados.
- Envios reais pelo endereço Quizzer: M2 `3dbdb609-4968-81e3-9e1a-ff0a6d0a40f4`; M5 `3dbdb609-4968-81b7-900d-d90c606204aa`. Novos campos preservados no JSON e Markdown da base Atlas, `strategic-v3`, triagem em `needs_editorial_review`; M5 também inclui galeria, equipe e blog. Ambos marcados com Status Arquivado após conferência. Nenhum cliente real foi usado.
- Lint global continua com o erro de formatação preexistente em `src/onboarding/submit.ts:6` e seis avisos de Fast Refresh de componentes compartilhados. Build e verificações do formulário passaram.
- Reversão anterior à revisão: Worker `bd07a9e5-6f35-4236-8823-47877a5938e3`; backend `dpl_Gge3JxUfBrqde9xUvFsMuaWALRRc`. Preservar registros e propriedades Notion ao reverter.

## Identificação de obrigatoriedade

Campos exibem etiquetas textuais Obrigatório ou Opcional, distinguíveis também pela cor e borda. WhatsApp/e-mail mostram Preencha pelo menos um e aviso de grupo. Modelo e confirmação também são identificados. Seções condicionais explicam que a escolha exige seus detalhes obrigatórios. As regras de validação e o envio não mudaram. Conferido em 320/390 px e 39 testes existentes aprovados. Worker `c140bae3-1c9c-4e33-843e-9546cad2ad51`, verificador de deploy aprovado; JS/CSS públicos conferidos contra a origem. Lint global conserva a pendência preexistente do onboarding.
