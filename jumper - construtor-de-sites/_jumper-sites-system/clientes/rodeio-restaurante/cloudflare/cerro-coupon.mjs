// Keeps the approved Cerro Corá offer live while the static site and Worker
// deploy histories are brought back together. New static builds carry the
// data-campaign marker and pass through unchanged.
const coupon = '0,99_IZI';
const whatsappText = 'Olá! Vim pela landing da IZI Gym e quero saber sobre o primeiro mês por R$ 0,99 com o cupom 0,99_IZI.';

const couponStyles = `
.hero-story.hero-offer{width:min(780px,68vw)}
.hero-offer h1{font-size:clamp(58px,6.2vw,96px)}
.hero-prices{display:flex;align-items:baseline;gap:.17em;white-space:nowrap}
.hero-old-price{font-size:.66em;color:#fff;text-decoration-color:#ff3a20;text-decoration-thickness:.055em;opacity:.9}
.hero-price{font-size:1em}
.hero-benefit{margin-bottom:19px}
.hero-coupon{display:inline-flex;align-items:center;gap:12px;padding:8px 10px 8px 16px;margin:0 0 20px;border:1px solid rgba(255,255,255,.62);border-radius:999px;background:rgba(255,255,255,.1);backdrop-filter:blur(10px);font-size:13px;line-height:1.2;letter-spacing:.015em}
.hero-coupon strong{padding:9px 13px;border-radius:999px;background:#fff;color:#434341;font-weight:400;letter-spacing:.035em;white-space:nowrap}
.hero-offer .primary-sale{width:min(520px,100%);font-size:17px!important}
.plan-coupon-note{margin-top:14px;padding:14px 16px;border:1px solid #e52c12;border-radius:14px;line-height:1.4!important}
.plan-coupon-note strong,.footer-offer strong,.modal-coupon strong{color:#e52c12;font-weight:400}
.footer-offer s{text-decoration-color:#e52c12}
.modal-coupon{margin:-6px 0 16px;padding:12px 15px;border:1px solid #e52c12;border-radius:12px;font-size:14px;line-height:1.4}
@media(min-width:768px){
 .hero{height:auto;max-height:none;min-height:max(800px,100svh)}
 .hero-layout{height:auto;min-height:max(800px,100svh);padding-top:148px}
}
@media(max-width:767px){
 .hero-story.hero-offer{width:100%}
 .hero-offer h1{font-size:clamp(39px,10.6vw,53px)}
 .hero-prices{gap:.12em}
 .hero-old-price{font-size:.63em}
 .hero-price{margin-top:0;font-size:1em}
 .hero-benefit{margin:15px 0 15px}
 .hero-coupon{gap:7px;padding:7px 8px 7px 11px;margin-bottom:16px;font-size:10px}
 .hero-coupon strong{padding:7px 8px;font-size:11px}
 .hero-offer .primary-sale{font-size:13px!important;white-space:normal;line-height:1.15}
 .mobile-cta>div>span{font-size:23px}
 .mobile-cta .primary-sale{font-size:14px!important}
}
@media(max-width:359px), (max-height:699px) and (max-width:767px){
 .hero-offer h1{font-size:35px}
 .hero-coupon{margin-bottom:11px;font-size:9px}
 .hero-coupon strong{font-size:10px}
 .hero-offer .primary-sale{font-size:12px!important}
}`;


function replaceOne(html, oldText, newText) {
  const parts = html.split(oldText);
  if (parts.length !== 2) throw new Error(`Cerro Corá markup changed near: ${oldText.slice(0, 60)}`);
  return parts[0] + newText + parts[1];
}

export function applyCerroCoupon(html, { strict = false } = {}) {
  if (html.includes(`data-campaign="${coupon}"`)) return html;
  try {
    let result = html;
    result = replaceOne(result, '<title>IZI Gym Vila Romana — Primeiro mês por R$ 27</title>', '<title>IZI Gym Vila Romana — Primeiro mês por R$ 0,99 com cupom</title>');
    result = replaceOne(result, 'content="Seu primeiro mês por R$ 27 na IZI Gym Vila Romana. Plano completo com studio, cycle e relax ilimitados."', 'content="A campanha de R$ 27 ficou ainda melhor: primeiro mês por R$ 0,99 com o cupom 0,99_IZI no checkout. Plano completo na IZI Gym Vila Romana."');
    result = replaceOne(result, '<h1 id="headline">Seu primeiro mês<br> por <span class="hero-price">R$ 27<sup>*</sup></span></h1>', '<h1 id="headline" data-campaign="0,99_IZI">Seu primeiro mês<br><span class="hero-prices"><s class="hero-old-price">R$ 27</s> <span class="hero-price">R$ 0,99</span></span></h1>');
    result = replaceOne(result, '<p class="hero-benefit">Plano completo com <strong>studio, cycle e relax ilimitados.</strong></p>', '<p class="hero-benefit">Plano completo com <strong>studio, cycle e relax ilimitados.</strong></p><p class="hero-coupon"><span>SOMENTE COM CUPOM EXCLUSIVO</span><strong>0,99_IZI</strong></p>');
    result = replaceOne(result, 'class="pill hero-button primary-sale" data-enroll="Primeiro mês">Garantir 1º mês por R$ 27', 'class="pill hero-button primary-sale" data-enroll="Primeiro mês com cupom 0,99_IZI">Usar cupom e garantir meu 1º mês');
    result = replaceOne(result, '<small class="hero-terms">Depois, R$ 167/mês. Oferta por tempo limitado.</small>', '<small class="hero-terms">Use o cupom no checkout. Depois, R$ 167/mês. Oferta por tempo limitado.</small>');
    result = replaceOne(result, '<p>Depois, R$ 167/mês.</p><ul>', '<p>Depois, R$ 167/mês.</p><p class="plan-coupon-note">Com o cupom <strong>0,99_IZI</strong> no checkout, seu primeiro mês sai por <strong>R$ 0,99.</strong></p><ul>');
    result = replaceOne(result, '<p class="legal">*Condição de inauguração por tempo limitado no Plano Izi Premium. Demais mensalidades: R$ 167. Consulte as condições de contratação com a equipe.</p>', '<p class="legal">*Campanha anunciada de R$ 27 no primeiro mês do Plano Izi Premium. Com o cupom 0,99_IZI no checkout, primeiro mês por R$ 0,99. Demais mensalidades: R$ 167. Consulte as condições de contratação com a equipe.</p>');
    result = replaceOne(result, '<p>A oferta é de R$ 27 no primeiro mês do Plano Izi Premium. As demais mensalidades são de R$ 167. Confirme com a equipe a disponibilidade e todas as condições antes da matrícula.</p>', '<p>A campanha anunciada é de R$ 27 no primeiro mês do Plano Izi Premium. Com o cupom exclusivo 0,99_IZI no checkout, o primeiro mês sai por R$ 0,99. As demais mensalidades são de R$ 167. Confirme as condições antes da matrícula.</p>');
    result = replaceOne(result, '<div class="footer-offer"><p>Seu primeiro mês por R$ 27 no plano completo.</p><button class="pill primary-sale" data-enroll="Primeiro mês">Garantir 1º mês por R$ 27', '<div class="footer-offer"><p>Seu primeiro mês no plano completo: <s>R$ 27</s> <strong>R$ 0,99</strong> com o cupom <strong>0,99_IZI</strong> no checkout.</p><button class="pill primary-sale" data-enroll="Primeiro mês com cupom 0,99_IZI">Usar cupom e garantir meu 1º mês');
    result = replaceOne(result, '<div class="mobile-cta" inert><div><small>1º mês</small><span>R$ 27<sup>*</sup></span></div><button class="pill dark primary-sale" data-enroll="Primeiro mês">Garantir R$ 27', '<div class="mobile-cta" inert><div><small>1º mês com cupom</small><span>R$ 0,99</span></div><button class="pill dark primary-sale" data-enroll="Primeiro mês com cupom 0,99_IZI">Usar cupom');
    result = replaceOne(result, '<div id="form-host"></div>', '<p class="modal-coupon" hidden>Seu primeiro mês por <strong>R$ 0,99</strong> com o cupom <strong>0,99_IZI</strong> no checkout.</p><div id="form-host"></div>');
    const oldWhatsapp = 'text=' + encodeURIComponent('Olá! Vim pela landing da IZI Gym e quero saber sobre o primeiro mês por R$ 27.');
    const newWhatsapp = 'text=' + encodeURIComponent(whatsappText);
    if (!result.includes(oldWhatsapp)) throw new Error('Cerro Corá WhatsApp links changed');
    result = result.replaceAll(oldWhatsapp, newWhatsapp);
    result = replaceOne(result, '</head>', `<style id="cerro-coupon-styles">${couponStyles}</style></head>`);
    result = replaceOne(result, '</body>', `<script>document.querySelectorAll('[data-enroll]').forEach(function(button){button.addEventListener('click',function(){var note=document.querySelector('.modal-coupon');if(note)note.hidden=button.dataset.enroll==='One';},{capture:true});});</script></body>`);
    return result;
  } catch (error) {
    if (strict) throw error;
    console.error('Cerro Corá coupon transform skipped:', error);
    return html;
  }
}
