const destination = 'https://site.jumper.dev.br/briefing';
export default function handler(request, response) {
  if (!['GET','HEAD'].includes(request.method)) {
    response.setHeader('Allow','GET, HEAD');response.status(405).end();return;
  }
  const incoming = new URL(request.url, 'https://briefing-formulario-sites-jumper.vercel.app');
  response.setHeader('Location', destination + incoming.search);
  response.setHeader('Cache-Control','no-cache');
  response.status(308).end();
}
