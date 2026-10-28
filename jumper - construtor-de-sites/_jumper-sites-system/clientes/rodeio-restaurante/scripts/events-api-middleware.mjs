import {rodeioEvents} from '../cloudflare/rodeio-events.mjs';
import {rodeioContact} from '../cloudflare/rodeio-contact.mjs';
// Match the Cloudflare handler in both Astro development and local build previews.
export default function eventsApi() {
  const attach=server=>{ server.middlewares.use(async (req,res,next)=>{
    const url = req.url || '';
    const isEvents = /^\/(?:rodeio\/)?api\/eventos\/?(?:\?|$)/.test(url);
    const isContact = /^\/(?:rodeio\/)?api\/contato\/?(?:\?|$)/.test(url);
    if (!isEvents && !isContact) return next();
    try {
      let body=''; for await(const chunk of req) { body+=chunk; if(body.length>8192) {res.statusCode=413;res.end();return;} }
      const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,...(req.method!=='GET'&&req.method!=='HEAD'?{body}: {})});
      const response=await (isContact ? rodeioContact(request) : rodeioEvents(request));
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
    } catch {res.statusCode=502;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({success:false,message:'Não foi possível confirmar o envio. Ligue (11) 3474-1333.'}));}
  }); };
  return {name:'rodeio-events-api',configureServer:attach,configurePreviewServer:attach};
}
