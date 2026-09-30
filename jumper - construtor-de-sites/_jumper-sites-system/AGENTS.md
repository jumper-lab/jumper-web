# Construtor de Sites Jumper Studio

## Regra de abertura

Quando a pessoa disser "abrir o construtor", "abra o construtor", "abrir construtor", "criador de sites" ou expressão equivalente neste projeto, isso significa exibir no próprio chat o menu conversacional **CONSTRUTOR DE SITES JUMPER STUDIO®**.

Nessa situação:

- não iniciar nem abrir o formulário local em `Quiz/Briefings/`;
- não interpretar o pedido como o recurso genérico Sites do ChatGPT/Codex;
- não abrir URL, servidor local, navegador ou aplicação externa;
- exibir diretamente o menu abaixo e aguardar a escolha numérica.

Não coloque o menu em bloco de código, tabela ou caixa ASCII. Use exatamente este formato:

────────────────────────────────────────<br>
**CONSTRUTOR DE SITES JUMPER STUDIO®**<br>
────────────────────────────────────────<br>
MENU - Digite o número para escolher a opção<br>
────────────────────────────────────────<br>
**Cliente**<br>
01. Anexar briefing do Cliente<br>
02. Gerar preview de um Cliente<br>
03. Editar Cliente<br>
04. Inserir imagens do Cliente, Editar Pexels ou assets<br>
05. Previews HTML dos DS<br>
────────────────────────────────────────<br>
**Sistema**<br>
06. Rever Fluxo do Sistema de Construção de Sites Jumper<br>
07. Preparar build ou deploy<br>
08. Ajustar prompts do sistema<br>
09. Ler Docs<br>
────────────────────────────────────────<br>
**Menu**<br>
10. Sair do Menu<br>
────────────────────────────────────────

As instruções operacionais detalhadas de cada opção continuam documentadas em `../backup/AGENTS.md` e na documentação mestre do sistema.

## Publicação de sites pelo Jumper Hoster

Esta é a regra operacional obrigatória para agentes que alteram o hub, o formulário
de briefing, o construtor ou sites hospedados pelo `jumper-hoster`. O procedimento,
os endereços e as limitações estão em `JUMPER-HOSTER.md`; não mantenha uma
segunda lista de regras naquele manual.

- O menu **CONSTRUTOR DE SITES JUMPER STUDIO®** é uma interação neste chat.
  `https://site.jumper.dev.br/briefing/` é o formulário público de entrada;
  não é o endereço de publicação do site criado pelo construtor.
- Todo site novo criado pelo construtor vai **primeiro** a uma rota de cliente
  no Worker `jumper-hoster-dev`, para revisão. Nunca publique um site novo
  diretamente no `jumper-hoster` live ou em seu domínio oficial por inferência.
  Um slug novo precisa de registro, rota dev e testes específicos antes de
  receber tráfego; não crie uma rota ampla que capture o hub ou outro cliente.
- Os links públicos atuais não mudam: `/` (hub), `/briefing/`, `/briefing/api/*`,
  `/__jumper/*`, `/api/*`, `/fonts/*` e os domínios oficiais continuam no
  `jumper-hoster` live. As rotas `/<slug>/*` declaradas em
  `clientes/rodeio-restaurante/wrangler.dev.jsonc` vão ao Worker dev.
  Uma prévia dev do hub requer novo endereço e proteção de equipe verificada.
  O briefing enviado ao cliente deve continuar **público, sem login ou senha**.
  Se houver prévia do formulário, use endereço separado e backend de teste
  isolado; nunca capture respostas de clientes na prévia nem mova o link live.
- Para mudar um site existente, trabalhe em branch isolada e declare **um único
  slug** autorizado. Monte o pacote local, atualize o inventário de arquivos
  **apenas desse slug** com `npm run inventory:dev -- --allow=<slug>` se os
  caminhos de assets mudaram, revise o diff, rode os testes e
  `npm run preflight:dev -- --allow=<slug>` em
  `clientes/rodeio-restaurante`. A verificação deve comparar os outros sites
  com as versões publicadas no dev **antes** de qualquer upload. Se houver
  diferença, erro de leitura, rota inesperada ou outro deploy concorrente,
  pare; não publique, não use `wrangler deploy` para contornar a trava e não
  copie a versão live por cima do dev. Investigue e reconcilie por PR.
- O fluxo do Hoster é branch → build e testes → PR → prévia no dev mediante
  autorização → revisão → merge em `main` → publicação live separada e
  explicitamente autorizada. PR/merge não dispara deploy do Hoster por GitHub
  Actions. Deploy dev usa `npm run deploy:dev -- --allow=<slug>`; deploy live
  usa o preflight e o comando documentados no manual, a partir de `main` limpo.
  Um deploy do Worker live monta o pacote completo, não apenas um cliente.
- A autorização de deploy dev **não** autoriza deploy live. Antes de publicar
  no live, confira as páginas e funções afetadas, domínios oficiais, hub,
  briefing, autenticação, APIs, dados e rastreamento. Alterações intencionais
  de mais de um site ou de áreas compartilhadas exigem escopo e revisão
  explícitos; não marque diferenças inesperadas como permitidas para fazer o
  preflight passar.
- O hub live permanece protegido por senha. A senha do hub usa o segredo
  `JUMPER_HUB_PASSWORD`; as áreas administrativas conservam
  `JUMPER_HOSTER_PASSWORD`. Nunca escreva valores de senha no GitHub, em PRs,
  documentação ou logs. A eventual prévia dev do hub também exige senha,
  além da proteção de equipe, e recebe o segredo no Worker dev separadamente.
  Não confunda senha do hub com proteção dos sites dev.
- Sites dev são públicos por padrão. Somente se o usuário pedir uma prévia
  privada, pergunte **qual slug** e qual senha ele quer definir para aquele
  site. Configure apenas o segredo Cloudflare
  `HOSTER_DEV_PASSWORD_<SLUG>` correspondente. Cada senha protege o HTML e os
  assets daquele slug, sem afetar os demais ou os domínios live. Mudanças de
  segredo criam versões do Worker; siga o preflight e a publicação controlada
  do manual, nunca execute `wrangler secret put` direto sem revisão.
