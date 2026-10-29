(() => {
  'use strict';
  const boot = () => {
    const root = document.querySelector('#acf-group_rodeio_editor_v1');
    const config = window.rodeioEditorStudio;
    if (!root || !config || root.dataset.studio) return;
    root.dataset.studio = 'ready';
    document.body.classList.add('rodeio-studio-screen');
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
    const top = el('div', 'rde-studio-top');
    top.append(el('p', 'rde-kicker', 'RODEIO · ESTÚDIO DE CONTEÚDO'));
    top.append(el('h2', '', config.shared ? 'Os detalhes que conectam o site.' : 'Dê vida a esta página.'));
    top.append(el('p', '', config.shared ? 'Esta área aparece em várias páginas. Uma edição atualiza todas elas.' : 'Edite os conteúdos com calma. O layout aprovado continua no lugar.'));
    const preview = el('a', 'rde-preview-link', 'Ver site ↗'); preview.href = config.preview; preview.target = '_blank'; preview.rel = 'noopener noreferrer'; top.append(preview);
    root.prepend(top);
    const shortcuts = el('details', 'rde-shortcuts'); shortcuts.append(el('summary', '', 'Editar menu, rodapé, contatos ou lightboxes'));
    const list = el('div', 'rde-shortcut-list');
    config.areas.forEach(a => { const link = el('a', '', a.label); link.href = a.url; list.append(link); }); shortcuts.append(list); top.append(shortcuts);
    const bar = el('div', 'rde-studio-tools');
    const searchLabel = el('label', '', 'Encontrar conteúdo'); const search = el('input'); search.type = 'search'; search.placeholder = 'Busque uma frase, foto ou destino…'; searchLabel.append(search);
    const sectionLabel = el('label', '', config.defaultSection ? 'Janela para editar' : 'Parte da página'); const select = el('select'); const all = el('option', '', 'Todas as seções'); all.value = ''; select.append(all); sectionLabel.append(select);
    bar.append(searchLabel, sectionLabel); top.after(bar);
    const advancedLabel=el('label','rde-technical-toggle');const advanced=el('input');advanced.type='checkbox';advancedLabel.append(advanced,document.createTextNode('Mostrar controles técnicos'));bar.append(advancedLabel);
    const result = el('p', 'rde-filter-result'); result.setAttribute('role', 'status'); bar.after(result);
    const records = []; const sections = new Set();
    for (const [kind, meta] of Object.entries(config.rows)) {
      const field = root.querySelector(`.acf-field[data-name="rde_${kind}"]`); if (!field) continue;
      const rows = Array.from(field.querySelectorAll(':scope > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)'));
      rows.forEach((row, index) => {
        const m = meta[index]; if (!m) return; sections.add(m.section);
        row.classList.add('rde-content-card');
        const context = row.querySelector(`.acf-field[data-name="rde_${kind}_context"]`);
        if (context) context.classList.add('rde-context');
        const content = row.querySelector(':scope > td.acf-fields'); if (!content) return;
        const summary = el('button', 'rde-card-summary'); summary.type = 'button';
        const copy = el('span', 'rde-card-heading'); copy.append(el('span', 'rde-card-section', m.section), el('strong', '', m.label));
        const caption = el('span', 'rde-card-caption');
        const input = row.querySelector(`[data-name="rde_${kind}_value"] textarea`) || row.querySelector(`[data-name="rde_${kind}_url"] input`);
        const update = () => { caption.textContent = (kind === 'texts' ? input?.value : m.context) || 'Editar conteúdo'; }; update();
        if(input) input.addEventListener('input', update);
        copy.append(caption); summary.append(copy, el('span', 'rde-card-toggle', 'Editar +')); content.prepend(summary);
        const setOpen = open => {row.classList.toggle('rde-card-closed', !open); row.classList.remove('-collapsed'); summary.setAttribute('aria-expanded', String(open)); summary.lastChild.textContent = open ? 'Recolher −' : (m.shared ? 'Ver origem ↗' : 'Editar +');};
        setOpen(false); summary.addEventListener('click', () => setOpen(row.classList.contains('rde-card-closed')));
        records.push({row, m, input, kind, setOpen});
        if(m.shared && input) {
          input.readOnly=true;row.classList.add('rde-shared-value');
          const note=el('p','rde-shared-reference','Informação compartilhada. Para alterar em todo o site, use ');const link=el('a','','Dados e contatos');link.href=m.settingsUrl;note.append(link,document.createTextNode('.'));summary.after(note);
        }
        if(kind === 'texts') {
          const label = row.querySelector('[data-name="rde_texts_value"] .acf-label label'); if(label) label.textContent = m.label;
        }
        if(kind === 'links' && input && !m.key.includes('@data-menu') && !m.shared) {
          const path=m.key.split('@')[0];
          const labels=(config.rows.texts || []).map((t,i)=>({t,i})).filter(({t})=>t.key.startsWith(path+'/'));
          if(labels.length===1) {
            const source=root.querySelectorAll('.acf-field[data-name="rde_texts"] > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)')[labels[0].i]?.querySelector('[data-name="rde_texts_value"] textarea');
            if(source) {const pair=el('label','rde-link-label','Texto do botão ou link');const editor=el('input');editor.type='text';editor.value=source.value;pair.append(editor);input.closest('.acf-field').prepend(pair);editor.addEventListener('input',()=>{source.value=editor.value;source.dispatchEvent(new Event('input',{bubbles:true}));source.dispatchEvent(new Event('change',{bubbles:true}));caption.textContent=editor.value;});source.addEventListener('input',()=>{editor.value=source.value;});}
          }
          const group = input.closest('.acf-field');const label=el('label','rde-destination-type','Ao clicar, o visitante vai…');const type=el('select');
          for(const [value,title] of [['page','Abrir uma página ou site'],['email','Escrever um e-mail'],['phone','Fazer uma ligação'],['anchor','Ir para uma seção']]) {const option=el('option','',title);option.value=value;type.append(option);}
          type.value=input.value.startsWith('mailto:')?'email':input.value.startsWith('tel:')?'phone':input.value.startsWith('#')?'anchor':'page';label.append(type);group.querySelector('.acf-input').prepend(label);
          const normalize=()=>{const raw=input.value.trim();const prefix={email:'mailto:',phone:'tel:',anchor:'#'}[type.value];if(prefix && raw && !raw.startsWith(prefix)){input.value=prefix+raw.replace(/^(mailto:|tel:|#)/,'');input.dispatchEvent(new Event('input',{bubbles:true}));}};
          type.addEventListener('change',()=>{input.placeholder={email:'nome@rodeiosp.com.br',phone:'+551134741333',anchor:'nome-da-secao',page:'https://… ou /pagina/'}[type.value];});input.addEventListener('blur',normalize);
        }
        if(kind === 'images') {
          const photo = row.querySelector('.rde-image-preview'); if(photo) {const thumb=el('img','rde-card-thumb');thumb.src=photo.src;thumb.alt='';thumb.loading='lazy';summary.prepend(thumb);}
          const url = row.querySelector('[data-name="rde_images_url"]');
          if(url) {
            const details = el('details', 'rde-image-address'); details.append(el('summary', '', 'Opção avançada: usar endereço de imagem'));
            const previewImage = url.querySelector('.rde-image-preview');
            if(previewImage) {const frame = el('div', 'rde-photo-frame');frame.append(previewImage);summary.after(frame);}
            url.before(details);details.append(url);
          }
        }
      });
      const tab = root.querySelector(`.acf-tab-group .acf-tab-button[data-key="field_rde_tab_${kind}"]`);
      if(tab && !rows.length && tab.closest('li')) tab.closest('li').hidden = true;
      if(tab && rows.length) {const badge = el('span', 'rde-count', String(rows.length));tab.append(badge);}
    }
    root.querySelectorAll('.acf-tab-button[data-key^="field_rde_tab_"]').forEach(tab => {const kind=tab.dataset.key.replace('field_rde_tab_','');if(!config.rows[kind]?.length && tab.closest('li')) tab.closest('li').hidden=true;});
    sections.forEach(s => {const option = el('option', '', s); option.value = s; select.append(option);});
    if(config.defaultSection && sections.has(config.defaultSection)) select.value=config.defaultSection;
    const filter = () => {
      const q = search.value.trim().toLocaleLowerCase('pt-BR');let found=0;const counts={};
      records.forEach(r => {const hay = [r.m.section, r.m.label, r.m.context, r.input?.value].join(' ').toLocaleLowerCase('pt-BR');const show = (!select.value || select.value === r.m.section) && (!q || hay.includes(q)) && (!r.m.technical || advanced.checked);r.row.classList.toggle('rde-filter-hidden', !show);if(show){found++;counts[r.kind]=(counts[r.kind]||0)+1;}});
      const tabs=Array.from(root.querySelectorAll('.acf-tab-group .acf-tab-button[data-key^="field_rde_tab_"]'));
      tabs.forEach(tab=>{const kind=tab.dataset.key.replace('field_rde_tab_','');const li=tab.closest('li');if(!li)return;li.hidden=!counts[kind];const badge=tab.querySelector('.rde-count');if(badge)badge.textContent=String(counts[kind]||0);});
      const active=tabs.find(t=>t.closest('li')?.classList.contains('active'));
      if(!active || active.closest('li').hidden) tabs.find(t=>!t.closest('li')?.hidden)?.click();
      result.textContent = found ? `${found} conteúdos nesta seleção. Abra um cartão para editar.` : 'Nenhum conteúdo nesta seleção. Tente outra parte ou limpe a busca.';
    };
    search.addEventListener('input', filter); select.addEventListener('change', filter);advanced.addEventListener('change',filter);filter();
    // ACF's original fields and names stay in the form, including every hidden row.
    document.addEventListener('invalid', e => {const record = records.find(r => r.row.contains(e.target));if(record) {search.value='';select.value='';filter();record.setOpen(true);}}, true);
    const html = document.getElementById('postdivrich');
    if(html) { const advanced = el('details', 'rde-advanced'); advanced.append(el('summary', '', 'Área técnica · HTML da página')); html.before(advanced);advanced.append(el('p', '', 'Os campos acima já atualizam este código. Use esta área apenas para mudanças na estrutura.')); advanced.append(html); }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
