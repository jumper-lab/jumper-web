import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {rodeioEvents} from '../cloudflare/rodeio-events.mjs';
const root=resolve('dist');
const base=(process.env.BASE_PATH||'/rodeio').replace(/\/$/,'');
const port=Number(process.env.PORT||4326);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.avif':'image/avif','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml'};
http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,`http://${req.headers.host}`);
    if(url.pathname===`${base}/api/eventos`||url.pathname===`${base}/api/eventos/`){
      let body='';for await(const chunk of req){body+=chunk;if(body.length>8192){res.writeHead(413);res.end();return;}}
      const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}:{})});
      const response=await rodeioEvents(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    if(url.pathname===base){res.writeHead(308,{Location:base+'/'});res.end();return;}
    if(base&&!url.pathname.startsWith(base+'/')){res.writeHead(404);res.end();return;}
    let file=resolve(root,'.'+decodeURIComponent(url.pathname.slice(base.length)));
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(404);res.end();return;}
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);
  }catch{
    const pathname=new URL(req.url,`http://${req.headers.host}`).pathname;
    if(pathname.startsWith(base+'/')&&req.headers.accept?.includes('text/html')){
      try{const page=await readFile(resolve(root,'404.html'));res.writeHead(404,{'Content-Type':mime['.html'],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:page);return;}catch{}
    }
    res.writeHead(404);res.end('Not Found');
  }
}).listen(port,'127.0.0.1',()=>console.log(`Prévia local: http://127.0.0.1:${port}${base}/`));
