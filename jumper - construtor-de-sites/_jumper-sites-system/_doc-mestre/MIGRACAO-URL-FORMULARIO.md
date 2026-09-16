# Endereço do formulário — publicação oficial

Data: 14/09/2026. Endereço público oficial: https://site.jumper.dev.br/briefing . Rota técnica compatível: https://quizzer.jumpers.cloud/briefing-novo-site .

## Conexões

- O endereço oficial `site.jumper.dev.br/briefing` entrega o formulário M1–M5 e seus assets. O card do hub aponta somente para esse endereço.
- A rota técnica `quizzer.jumpers.cloud/briefing-novo-site` conserva os mesmos arquivos e processamento para compatibilidade; ela não deve aparecer em novos links públicos.
- O navegador no endereço oficial envia para `https://site.jumper.dev.br/briefing/api/briefings`.
- O transporte do Worker encaminha o JSON ao endpoint de compatibilidade da Vercel (`briefing-formulario-sites-jumper.vercel.app`, path `/api/briefings`). A Vercel mantém o segredo Notion e a mesma base do Jumper Atlas. Esse endpoint é uma exceção técnica intencional, não um link público de preenchimento. Nunca redirecioná-lo ao Quizzer, pois criaria um ciclo.
- Abas já abertas na rota técnica podem continuar enviando pela API de compatibilidade.
- O botão do Construtor no Notion e a referência encontrada na página Site Rodeio foram atualizados e conferidos. Documentação local do Construtor foi atualizada. Outras cópias já distribuídas ficam cobertas pelo redirecionamento.
- Nenhuma conta, tarefa ou site de cliente é criado automaticamente por esta migração.

## Rascunhos

localStorage não é compartilhado entre domínios. A interface permite exportar e importar um rascunho JSON na primeira etapa para continuar em outro aparelho ou endereço. A cópia não restaura confirmação de envio e exclui o campo legado de senha do blog. Quem já enviou é avisado antes de copiar e reenviar.

## Atualização futura

1. Editar a fonte `Quiz/Briefings/` no Construtor de Sites.
2. No repositório `jumperquizzer`, executar `node scripts/sync-site-briefing.mjs /caminho/Quiz/Briefings`. O manifesto registra hashes dos arquivos de origem; não copiar credenciais ou registros de clientes.
3. Rodar os testes do formulário, `node --test scripts/site-briefing.test.mjs`, lint dos arquivos alterados e build. Conferir a experiência no runtime Cloudflare, incluindo envio. O transporte usa `redirect: manual`, com rejeição explícita de 3xx; `redirect: error` não é aceito pelo runtime utilizado.
4. Publicar no Quizzer pelo comando oficial `bun run deploy:production`. Ele verifica as rotas existentes, assets e validação da API do briefing, além do evento técnico Supabase da plataforma.
5. Mudanças no processamento Notion/validação exigem também deploy de `Quiz/Briefings` na Vercel. Preservar as exceções `/api/briefings` e `/recuperar-rascunho` no roteamento antigo.

## Evidências e reversão

- Cloudflare final: `51c4852c-579e-42b6-b5e5-a254c55c27e2` no Worker `jumper-quizzer`.
- Vercel de compatibilidade/redirecionamento: `dpl_GkjhkDryWfk4wN7AWERejtRL56dr`, projeto `briefing-quiz-local`.
- 32 testes do formulário e 5 testes do novo handler/transporte aprovados. M1–M5 percorridos no navegador sob a nova rota, com assets e revisão funcionando. Build, verificação pública das rotas existentes e evento técnico de verificação no Supabase aprovados.
- Lint dos arquivos alterados aprovado. O lint geral do Quizzer, excluindo builds/artefatos e o projeto independente `boiler-monte-seu-kit`, encontrou um erro de formatação preexistente em `src/onboarding/submit.ts` e seis avisos de Fast Refresh nos componentes UI. Não foram alterados por esta migração.
- Redirecionamento antigo confirmado com parâmetros preservados; API de compatibilidade continua validando entrada; recuperação de rascunhos responde HTTP 200. Notion: dois links encontrados e atualizados, com nova leitura confirmando ausência do endereço antigo nessas páginas.
- Se necessário reverter completamente, coordenar as duas plataformas: restaurar a interface anterior na Vercel (`dpl_4TBynkQrXPwn5rQrEBrXjWWiXeuP`) e o Worker anterior à migração (`b751c840-56bd-4883-843a-de319f6da436`), além dos links ativos. Não remover a API nem as respostas do Notion.
- Envio real pelo navegador no novo endereço: registro Notion `3dbdb609-4968-8100-99b6-dc34e3202dfc`, modelo M5, JSON completo, complementação, permissões e `pending_review` conferidos. Registro marcado como `🗄️ Arquivado`; não representa cliente real.
- A primeira verificação pública revelou incompatibilidade de `redirect: error` no runtime Cloudflare, antes do envio ao backend. Corrigida com modo manual e rejeição de 3xx; o envio real acima e a validação 400 passaram na versão final. O verificador de publicação agora cobre essa conexão.
- Recuperação de rascunho testada com dados sintéticos no navegador: exportação no formato esperado, modelo preservado, senha legada removida e confirmação/envio desmarcados. JS/CSS públicos conferidos byte a byte com a fonte. Endereço antigo seguido até o novo com HTTP 200 e sem ciclo.
