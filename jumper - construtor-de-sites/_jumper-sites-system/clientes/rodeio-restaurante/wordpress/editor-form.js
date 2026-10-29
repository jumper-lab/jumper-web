(() => {
  'use strict';
  const boot = () => {
    const root = document.getElementById('acf-group_rodeio_editor_v1');
    const config = window.rodeioEditorStudio;
    if (!root || !config?.blocks || root.dataset.formReady) return;
    root.dataset.formReady = 'yes';
    document.body.classList.add('rde-simple-screen');
    const el = (tag, cls, text) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text) node.textContent = text;
      return node;
    };
    const storage = root.querySelector(':scope > .inside');
    if (!storage) return;
    storage.classList.add('rde-acf-storage');
    storage.setAttribute('aria-hidden', 'true');
    // The original native fields keep their exact names, values and save/conflict pipeline.
    storage.querySelectorAll('[required]').forEach(node => node.removeAttribute('required'));
    const sourceRows = {};
    for (const kind of ['texts', 'images', 'links', 'menus']) {
      const field = storage.querySelector(`.acf-field[data-name="rde_${kind}"]`);
      sourceRows[kind] = field ? Array.from(field.querySelectorAll(':scope > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)')) : [];
    }
    const inputFor = (part, suffix) => sourceRows[part.kind]?.[part.index]?.querySelector(`[data-name="rde_${part.kind}_${suffix}"] input, [data-name="rde_${part.kind}_${suffix}"] textarea`);
    const write = (input, value) => {
      if (!input) return;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (window.jQuery) window.jQuery(input).trigger('change');
    };
    const header = el('div', 'rde-form-header');
    const identity = el('div', 'rde-form-identity');
    if (config.brandLogo) {const logo=el('img','rde-form-logo');logo.src=config.brandLogo;logo.alt='Rodeio — desde 1958';identity.append(logo);}
    identity.append(el('span', 'rde-form-eyebrow', 'ESTÚDIO DE CONTEÚDO')); header.append(identity);
    header.append(el('h2', '', config.title));
    header.append(el('p', '', 'Seu conteúdo, do seu jeito. Escolha uma seção, edite os campos e clique em Atualizar.'));
    const view = el('a', 'button', config.shared ? 'Ver site ↗' : 'Ver esta página no site ↗');
    view.href = config.preview; view.target = '_blank'; view.rel = 'noopener noreferrer'; header.append(view);
    root.append(header);
    const steps=el('div','rde-form-steps');
    ['Escolha uma seção','Edite textos, fotos e links','Salve em Atualizar'].forEach((text,index)=>{const step=el('span');step.append(el('b','',String(index+1).padStart(2,'0')),document.createTextNode(text));steps.append(step);});root.append(steps);
    const layout = el('div', 'rde-form-layout');
    const navigation = el('nav', 'rde-form-nav'); navigation.setAttribute('aria-label', 'Blocos de conteúdo');
    navigation.append(el('p','rde-form-nav-caption',config.shared?'NESTA ÁREA':'NESTA PÁGINA'));
    const content = el('div', 'rde-form-content'); layout.append(navigation, content); root.append(layout);
    const menuField = storage.querySelector('.acf-field[data-name="rde_menus"]');
    const controls = [];
    let selected = '';
    const sharedNotice = (part, host) => {
      const note = el('p', 'rde-form-origin', part.shared === 'PDF do cardápio' ? 'Arquivo e imagens gerenciados juntos em ' : 'Este dado aparece em várias áreas do site. Altere uma única vez em ');
      const link = el('a', '', part.settingsLabel || 'Dados e contatos'); link.href = part.settingsUrl; note.append(link); host.append(note);
    };
    const textControl = (part, host, total) => {
      const source = inputFor(part, 'value'); if (!source) return;
      const label = el('label', 'rde-form-field');
      label.append(el('span', 'rde-form-label', part.shared || part.fieldLabel || 'Texto'));
      if (part.shared) {
        label.append(el('span', 'rde-form-readonly', source.value)); host.append(label); sharedNotice(part, host); return;
      }
      if (total === 1) label.querySelector('.rde-form-label').classList.add('screen-reader-text');
      const multiline = source.value.length > 100 || /Descrição|Legenda|Endereço/.test(part.fieldLabel || '');
      const input = el(multiline ? 'textarea' : 'input');
      if (!multiline) input.type = 'text'; else input.rows = Math.min(7, Math.max(3, Math.ceil(source.value.length / 75)));
      input.value = source.value; input.required = true;
      input.dataset.rdeProxy = `texts:${part.index}`;
      input.addEventListener('input', () => write(source, input.value));
      controls.push({ input, source, part }); label.append(input); host.append(label);
    };
    const linkControl = (part, host) => {
      const source = inputFor(part, 'url'); if (!source) return;
      if (part.shared) {
        const label = el('div', 'rde-form-field'); label.append(el('span', 'rde-form-label', part.shared));
        if (part.shared !== 'PDF do cardápio') label.append(el('span', 'rde-form-readonly', source.value));
        host.append(label); sharedNotice(part, host); return;
      }
      const field = el('label', 'rde-form-field'); field.append(el('span', 'rde-form-label', 'Ao clicar, o visitante vai…'));
      const type = el('select');
      for (const [value, title] of [['page', 'Abrir uma página ou site'], ['email', 'Escrever um e-mail'], ['phone', 'Fazer uma ligação'], ['section', 'Ir para uma seção desta página']]) {
        const option = el('option', '', title); option.value = value; type.append(option);
      }
      const initialType = source.value.startsWith('mailto:') ? 'email' : source.value.startsWith('tel:') ? 'phone' : source.value.startsWith('#') ? 'section' : 'page';
      type.value = initialType; field.append(type); host.append(field);
      const label = el('label', 'rde-form-field'); const caption = el('span', 'rde-form-label'); label.append(caption);
      const input = el('input'); input.type = 'text'; input.required = true; input.dataset.rdeProxy = `links:${part.index}`;
      input.value = source.value.replace(/^(mailto:|tel:|#)/, '');
      const hint = el('small', 'rde-form-help');
      const renderType = () => {
        caption.textContent = {page:'Endereço da página ou site',email:'E-mail de destino',phone:'Telefone com DDD',section:'Identificador da seção'}[type.value];
        input.placeholder = {page:'https://… ou /reservas/',email:'nome@rodeiosp.com.br',phone:'+551134741333',section:'nossas-unidades'}[type.value];
        hint.textContent = type.value === 'page' ? 'Cole o endereço completo ou um caminho interno, como /reservas/.' : 'Informe apenas o destino. O prefixo correto é incluído automaticamente.';
      };
      const sync = () => {
        const raw = input.value.trim(); const prefix = {email:'mailto:',phone:'tel:',section:'#'}[type.value] || '';
        write(source, prefix + (prefix ? raw.replace(/^(mailto:|tel:|#)/, '') : raw));
      };
      input.addEventListener('input', sync); type.addEventListener('change', () => {renderType(); sync();}); renderType();
      label.append(input, hint); host.append(label); controls.push({input, source, part});
    };
    const imageControl = (part, host) => {
      const url = inputFor(part, 'url'), pick = inputFor(part, 'pick'), alt = inputFor(part, 'alt'), mobile = inputFor(part, 'mobile');
      if (!url || !pick) return;
      const image = el('img', 'rde-form-photo'); image.src = url.value; image.alt = alt?.value || ''; image.loading = 'lazy'; host.append(image);
      const choose = (target, isMobile = false) => {
        if (!window.wp?.media) return;
        const frame = wp.media({title:isMobile ? 'Imagem para celular' : 'Escolher ou enviar imagem',button:{text:'Usar esta imagem'},library:{type:'image'},multiple:false});
        frame.on('select', () => {
          const attachment = frame.state().get('selection').first().toJSON(); write(target, String(attachment.id));
          if (!isMobile) image.src = attachment.sizes?.large?.url || attachment.url;
          else mobileState.textContent = 'Imagem para celular selecionada.';
        }); frame.open();
      };
      const replace = el('button', 'button', 'Trocar imagem'); replace.type = 'button'; replace.addEventListener('click', () => choose(pick)); host.append(replace);
      const label = el('label', 'rde-form-field'); label.append(el('span', 'rde-form-label', 'Descrição da imagem'));
      const description = el('input'); description.type = 'text'; description.value = alt?.value || ''; description.addEventListener('input', () => write(alt, description.value)); label.append(description, el('small', 'rde-form-help', 'Descreva o que aparece na foto para quem usa leitor de tela.')); host.append(label);
      const mobileState = el('p', 'rde-form-help', mobile?.value && mobile.value !== '0' ? 'Há uma imagem própria para celular.' : 'O celular usa a imagem principal.');
      if (part.imageKind === 'picture' && mobile) {
        const details = el('details', 'rde-form-extra'); details.append(el('summary', '', 'Imagem específica para celular (opcional)'));
        const button = el('button', 'button', 'Escolher imagem para celular'); button.type = 'button'; button.addEventListener('click', () => choose(mobile, true));
        const clear = el('button', 'button-link', 'Usar a principal no celular'); clear.type = 'button'; clear.addEventListener('click', () => {write(mobile, '0'); mobileState.textContent = 'O celular usa a imagem principal.';});
        details.append(mobileState, button, clear); host.append(details);
      }
      const advanced = el('details', 'rde-form-extra'); advanced.append(el('summary', '', 'Usar uma imagem por endereço (avançado)'));
      const direct = el('input'); direct.type = 'text'; direct.value = url.value; direct.setAttribute('aria-label', 'Endereço da imagem'); direct.addEventListener('input', () => {write(url, direct.value); write(pick, '0'); if (/^(https?:\/\/|\/)/.test(direct.value)) image.src = direct.value;}); advanced.append(direct); host.append(advanced);
    };
    const blocks = config.blocks.filter(block => block.groups.some(group => group.parts.some(part => !part.technical)));
    const panels = [];
    for (const block of blocks) {
      const position=panels.length+1;
      const button = el('button', 'rde-form-block-button'); button.type = 'button'; button.setAttribute('aria-pressed', 'false');button.setAttribute('aria-label',block.title);
      button.append(el('span','rde-form-nav-number',String(position).padStart(2,'0')));
      const count=block.groups.filter(group=>group.parts.some(part=>!part.technical)).length;
      const navLabel=el('span','rde-form-nav-label');navLabel.append(el('strong','',block.title),el('small','',`${count} ${count===1?'conteúdo':'conteúdos'}`));button.append(navLabel);
      navigation.append(button);
      const panel = el('section', 'rde-form-block'); panel.hidden = true;
      const blockHead=el('div','rde-form-block-head');blockHead.append(el('p','rde-form-eyebrow',`SEÇÃO ${String(position).padStart(2,'0')} · ${config.shared?'ÁREA COMPARTILHADA':'CONTEÚDO DA PÁGINA'}`),el('h3', 'rde-form-block-title', block.title));
      const blockHelp=block.groups.some(group=>group.type==='image')?'As fotos atuais aparecem abaixo. Use Trocar imagem para escolher outra pela biblioteca.':block.groups.some(group=>group.type==='menu')?'Organize os itens e escolha para onde cada link leva.':block.title==='Horários'?'Cada período reúne os dias e seus horários de atendimento.':'Edite o conteúdo nos cartões abaixo. O layout do site é preservado.';
      blockHead.append(el('p','rde-form-block-help',blockHelp));panel.append(blockHead);
      const groups = block.groups.filter(group => group.parts.some(part => !part.technical));
      for (const group of groups) {
        const parts = group.parts.filter(part => !part.technical);
        const card = el('fieldset', `rde-form-card rde-form-card-${group.type}`); card.append(el('legend', '', group.label));
        if (group.type === 'menu') {
          card.classList.add('rde-form-menu-host'); card.dataset.menuIndexes = parts.filter(part => part.kind === 'menus').map(part => part.index).join(','); panel.append(card); continue;
        }
        if (parts.filter(part => part.kind === 'texts').length > 1) {
          const example = el('p', 'rde-form-example');
          parts.filter(part => part.kind === 'texts').forEach(part => {const text=el(part.emphasis ? 'em' : 'span', '', part.value);example.append(text,document.createTextNode(' '));const source=inputFor(part,'value');source?.addEventListener('input',()=>text.textContent=source.value);});
          card.append(example);
          if (group.type === 'text') card.append(el('p', 'rde-form-help', block.title==='Horários'?'Edite o período e os horários nos campos abaixo.':'Assim estes trechos aparecem juntos. Edite cada parte nos campos abaixo.'));
        }
        for (const part of parts) {
          if (part.kind === 'texts') textControl(part, card, parts.length);
          if (part.kind === 'links') linkControl(part, card);
          if (part.kind === 'images') imageControl(part, card);
        }
        panel.append(card);
      }
      content.append(panel); panels.push({block, panel, button});
      button.addEventListener('click', () => selectBlock(block.key));
    }
    const menuRows = sourceRows.menus || [];
    for (const [index, row] of menuRows.entries()) {
      row.classList.remove('-collapsed');
      row.querySelectorAll('[data-name="rde_menuitem_label"] .acf-label label').forEach(label=>label.textContent='Nome que aparece no menu');
      row.querySelectorAll('[data-name="rde_menuitem_url"] .acf-label label').forEach(label=>label.textContent='Página ou endereço de destino');
      const label = el('h4', 'rde-form-menu-name', config.rows.menus[index]?.context || 'Menu'); row.querySelector(':scope > td.acf-fields')?.prepend(label);
      row.querySelectorAll('[data-name="rde_menuitem_url"] input').forEach(input => {
        if (/\/cardapio-rodeio\.pdf(?:[?#]|$)/.test(input.value)) {
          input.readOnly = true; const note = el('p', 'rde-form-help', 'O arquivo é atualizado em '); const link = el('a', '', 'PDF do cardápio'); link.href = config.menuPdfUrl; note.append(link); input.after(note);
        }
      });
    }
    function selectBlock(key) {
      selected = key;
      if (menuField) storage.append(menuField);
      for (const entry of panels) {
        const active = entry.block.key === key; entry.panel.hidden = !active; entry.button.setAttribute('aria-pressed', String(active));
        if (active && menuField) {
          const hosts = Array.from(entry.panel.querySelectorAll('.rde-form-menu-host'));
          if (hosts.length) {
            const indexes = hosts.flatMap(host => host.dataset.menuIndexes.split(',').map(Number));
            hosts[0].append(menuField); hosts.slice(1).forEach(host => host.hidden = true);
            menuField.classList.remove('acf-hidden'); menuRows.forEach((row, index) => row.hidden = !indexes.includes(index));
          }
        }
      }
    }
    const defaultBlock = blocks.find(block => block.title === config.defaultSection) || blocks[0];
    if (defaultBlock) selectBlock(defaultBlock.key);
    const technical = document.getElementById('postdivrich');
    if (technical) {
      const details = el('details', 'rde-form-technical'); details.append(el('summary', '', 'Área técnica · HTML (não é necessário para editar o conteúdo)'));
      technical.before(details); details.append(technical);
    }
    // Surface a browser validation error in its own content block.
    document.addEventListener('invalid', event => {const panel = event.target.closest('.rde-form-block'); const entry = panels.find(item => item.panel === panel); if (entry) selectBlock(entry.block.key);}, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
