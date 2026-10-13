import {rodeioEvents} from '../cloudflare/rodeio-events.mjs';
// Match the Cloudflare handler in both Astro development and local build previews.
export default function eventsApi() {
  const attach=server=>{ server.middlewares.use(async (req,res,next)=>{
    if (!/^\/(?:rodeio\/)?api\/eventos\/?(?:\?|$)/.test(req.url||'')) return next();
    try {
      let body=''; for await(const chunk of req) { body+=chunk; if(body.length>8192) {res.statusCode=413;res.end();return;} }
      const request=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers:req.headers,...(req.method!=='GET'&&req.method!=='HEAD'?{body}: {})});
      const response=await rodeioEvents(request);
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
    } catch {res.statusCode=502;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({success:false,message:'Não foi possível confirmar o envio. Ligue (11) 3474-1333.'}));}
  }); };
  return {name:'rodeio-events-api',configureServer:attach,configurePreviewServer:attach};
}
