import test from 'node:test';
import assert from 'node:assert/strict';
import {rodeioEvents} from '../../cloudflare/rodeio-events.mjs';
const origin='https://site.jumper.dev.br';
const request=(fields={},headers={})=>new Request(origin+'/rodeio/api/eventos',{method:'POST',headers:{Origin:origin,...headers},body:new URLSearchParams({name:'Teste local',email:'teste@example.com',unit:'jardins',message:'Solicitação simulada',...fields})});
test('rejects invalid fields and cross-origin requests without contacting the provider',async()=>{
  const never=()=>assert.fail('Unexpected upstream request');
  assert.equal((await rodeioEvents(request({email:'invalid'}),never)).status,400);
  assert.equal((await rodeioEvents(request({}, {Origin:'https://example.com'}),never)).status,403);
  assert.equal((await rodeioEvents(request({website:'bot'}),never)).status,400);
});
test('uses a fresh nonce and the existing unit mapping; confirms only provider success',async()=>{
  for(const unit of ['jardins','iguatemi']){
    let calls=0;
    const response=await rodeioEvents(request({unit}),async(url,options)=>{
      assert.equal(url,'https://rodeiosp.com.br/wp-admin/admin-ajax.php');
      calls++;
      if(calls===1){assert.equal(options.body.get('action'),'forminator_get_nonce');return Response.json({success:true,data:'fresh-nonce'});}
      assert.equal(options.body.get('forminator_nonce'),'fresh-nonce');
      assert.equal(options.body.get('select-1'),unit==='jardins'?'one':'two');
      assert.equal(options.body.get('name-1'),'Teste local');
      assert.equal(options.body.get('action'),'forminator_submit_form_custom-forms');
      return Response.json({success:true,data:{success:true}});
    });
    assert.equal(calls,2);assert.equal((await response.json()).success,true);
  }
});
test('never reports success when provider rejects or times out',async()=>{
  for(const result of [{success:false,data:{success:false}},{success:true,data:{success:false}},{success:true}]){
    let calls=0;
    const response=await rodeioEvents(request(),async()=>++calls===1?Response.json({success:true,data:'nonce'}):Response.json(result));
    assert.equal(response.status,502);assert.equal((await response.json()).success,false);
  }
  const response=await rodeioEvents(request(),async()=>{throw new Error('Unavailable');});
  assert.equal(response.status,502);
});
