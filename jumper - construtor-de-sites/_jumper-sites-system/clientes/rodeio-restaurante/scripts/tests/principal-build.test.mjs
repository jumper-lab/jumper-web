import test from 'node:test';
import assert from 'node:assert/strict';
import { principalTrackingTags } from '../../../izigym-site/src/tracking/bootstrap.mjs';
import { validatePrincipalBuild } from '../prepare-principal.mjs';

const config={siteId:'principal',izi:{enabled:true,gtmId:'GTM-TGQTFXTN'}};
function fixture(tracking=config){const tags=principalTrackingTags(tracking);return `<html><head><script id="izi-principal-tracking">${tags[0].children}</script><script type="module" src="/assets/app.js"></script></head><body>${tags[1]?`<noscript>${tags[1].children}</noscript>`:''}<div id="root"></div></body></html>`;}
test('principal packaging accepts the reviewed React bootstrap and body-first fallback',()=>{
 const html=fixture();assert.equal(validatePrincipalBuild(html,config),html);
 const disabled={...config,izi:{...config.izi,enabled:false}};assert.equal(validatePrincipalBuild(fixture(disabled),disabled),fixture(disabled));
});
test('principal packaging rejects old, duplicated, misplaced or mismatched tracking',()=>{
 assert.throws(()=>validatePrincipalBuild('<html><body>old snapshot</body></html>',config),/bootstrap/);
 assert.throws(()=>validatePrincipalBuild(fixture().replace('</head>','<script id="izi-principal-tracking">duplicate</script></head>'),config),/bootstrap/);
 assert.throws(()=>validatePrincipalBuild(fixture().replace('<body>','<body><div>before fallback</div>'),config),/primeiro/);
 const moved=fixture().replace(/<script id="izi-principal-tracking">[\s\S]*?<\/script>/,'').replace('</body>',`<script id="izi-principal-tracking">${principalTrackingTags(config)[0].children}</script></body>`);
 assert.throws(()=>validatePrincipalBuild(moved,config),/head/);
 assert.throws(()=>validatePrincipalBuild(fixture(),{...config,izi:{...config.izi,enabled:false}}),/configuração/);
});
test('principal packaging cannot add Cative or direct platform installs',()=>{
 for(const extra of ['GTM-N52MH72F','https://www.googletagmanager.com/gtag/js','https://connect.facebook.net/sdk.js','https://www.clarity.ms/tag/id']){
  assert.throws(()=>validatePrincipalBuild(fixture().replace('</head>',extra+'</head>'),config),/Cative|plataforma/);
 }
});
