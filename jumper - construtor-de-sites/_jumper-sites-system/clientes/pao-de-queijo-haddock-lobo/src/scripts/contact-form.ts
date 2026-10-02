export function initContactForm(){
  const form=document.querySelector<HTMLFormElement>('[data-contact-form]');
  if(!form)return;
  const button=form.querySelector<HTMLButtonElement>('[data-contact-submit]')!;
  const status=form.querySelector<HTMLElement>('[data-contact-status]')!;
  const errors=form.querySelector<HTMLElement>('[data-contact-errors]')!;
  const fields=[...form.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('.contact-field input,.contact-field textarea')];
  let sending=false;
  form.noValidate=true;
  const fieldError=(field:HTMLInputElement|HTMLTextAreaElement)=>{
    if(!field.value.trim())return field.name==='name'?'Informe seu nome.':field.name==='email'?'Informe seu e-mail.':'Escreva sua mensagem.';
    if(field.validity.typeMismatch)return 'Confira o endereço de e-mail.';
    if(field.value.length>field.maxLength)return 'O texto ultrapassa o limite deste campo.';
    return '';
  };
  const showFieldError=(field:HTMLInputElement|HTMLTextAreaElement,message:string)=>{
    const note=field.closest('.contact-field')!.querySelector<HTMLElement>('[data-field-error]')!;
    note.textContent=message;note.hidden=!message;
    if(message)field.setAttribute('aria-invalid','true');else field.removeAttribute('aria-invalid');
  };
  fields.forEach(field=>field.addEventListener('input',()=>{
    if(field.hasAttribute('aria-invalid'))showFieldError(field,fieldError(field));
    if(fields.every(f=>!f.hasAttribute('aria-invalid')))errors.hidden=true;
    // Do not announce an old success for a different message.
    if(status.dataset.state==='success'){status.hidden=true;delete status.dataset.state;}
  }));
  const announce=(message:string,state:string)=>{status.textContent=message;status.dataset.state=state;status.hidden=false;};
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(sending)return;
    const endpoint=form.dataset.endpoint;
    if(!endpoint){announce('O envio ainda não está configurado. Nenhuma mensagem foi enviada.','error');return;}
    let destination:URL;
    try{destination=new URL(endpoint);if(destination.protocol!=='https:'||destination.username||destination.password||destination.search||destination.hash)throw new Error();}
    catch{announce('O serviço de contato não está disponível. Nenhuma mensagem foi enviada.','error');return;}
    const invalid=fields.filter(field=>{const message=fieldError(field);showFieldError(field,message);return !!message;});
    errors.hidden=!invalid.length;
    if(invalid.length){status.hidden=true;invalid[0].focus();return;}
    if(form.querySelector<HTMLInputElement>('[name=_gotcha]')!.value){announce('Não foi possível enviar esta mensagem.','error');return;}
    const payload=new FormData(form);
    fields.forEach(field=>payload.set(field.name,field.value.trim()));
    // Leave inputs editable while waiting, and never erase newer edits on completion.
    const submitted=fields.map(field=>field.value);
    const controller=new AbortController();
    const timer=window.setTimeout(()=>controller.abort(),12000);
    sending=true;button.disabled=true;button.textContent='Enviando…';form.setAttribute('aria-busy','true');status.hidden=true;
    try{
      const response=await fetch(destination.href,{method:'POST',body:payload,headers:{Accept:'application/json'},credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:controller.signal});
      if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error();
      const result=await response.json();
      if(result?.errors?.length||(result?.ok!==true&&result?.success!==true))throw new Error();
      if(fields.every((field,index)=>field.value===submitted[index]))form.reset();
      announce('Mensagem recebida pelo serviço de contato. Obrigado por falar com a gente.','success');
    }catch{
      announce('Não foi possível confirmar o envio. Seu texto foi mantido; você pode tentar novamente.','error');
    }finally{
      clearTimeout(timer);sending=false;button.disabled=!form.dataset.endpoint;button.textContent='Enviar mensagem';form.removeAttribute('aria-busy');
    }
  });
}
