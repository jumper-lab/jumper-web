"""Capture public approved WordPress pages. GET only; never uploads or submits forms."""
from pathlib import Path
import concurrent.futures, hashlib, html, json, re, urllib.request
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'wordpress/public-preview'
ORIGIN='https://rodeiosp.com.br'
RELEASE='/wp-content/themes/rodeio-2026/releases/rodeio-20261028-seo/site/'
ROUTES=['/','/cardapio/','/cardapio/completo/','/historia/','/eventos/','/eventos/orcamento/','/reservas/','/reservas/jardins/','/reservas/iguatemi/','/restaurantes/','/restaurantes/jardins/','/restaurantes/iguatemi/','/privacidade/','/sac/','/compliance/','/rodeio-em-casa/']
source_assets=json.loads((DEST/'source-assets.json').read_text())
records={}
def digest(b):return hashlib.sha256(b).hexdigest()
def read(url):
    if not url.startswith(ORIGIN+'/'):raise ValueError('Unexpected source origin')
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Jumper-Rodeio-Public-Preview','Cache-Control':'no-cache'}),timeout=35) as response:
        if response.status!=200 or not response.url.startswith(ORIGIN+'/'):raise ValueError('Unexpected response '+url)
        return response.read()
def rebase(s,html=False):
    s=s.replace('/wp-json/rodeio/v1/contato','/rodeio/api/contato').replace('/wp-json/rodeio/v1/eventos','/rodeio/api/eventos')
    s=s.replace(ORIGIN+RELEASE,RELEASE).replace(RELEASE+'_astro/','/rodeio/_wordpress/_astro/').replace(RELEASE,'/rodeio/')
    s=re.sub(r'(?:https://rodeiosp\.com\.br)?/wp-content/themes/rodeio-2026/(services\.css|contact-dialog\.js)(?:\?ver=\d+)?',r'/rodeio/_wordpress/\1',s)
    s=s.replace('https://rodeiosp.com.br/','https://site.jumper.dev.br/rodeio/').replace('https://www.rodeiosp.com.br/','https://site.jumper.dev.br/rodeio/')
    if html:
        s=re.sub(r'((?:href|src|srcset|action|data-menu-url|data-menu-alias-url|data-src|data-srcset|data-gallery-image)=["\'])/(?!/|rodeio(?:/|["\']))',r'\1/rodeio/',s)
        # Every srcset candidate needs its own base, including candidates after commas.
        s=re.sub(r'(,\s*)/(?:photos|logos|cardapio-paginas)/',lambda m:m.group(0).replace('/','/rodeio/',1),s)
        s=re.sub(r'<meta\b[^>]*name=["\']robots["\'][^>]*>','',s,flags=re.I)
        s=s.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>')
    if '/wp-content/' in s or '/wp-json/' in s:raise ValueError('Unmapped WordPress path')
    return s

def write(name,body,source_hash=None):
    if name.startswith('/') or '..' in Path(name).parts:raise ValueError('Unsafe snapshot path')
    p=DEST/'files'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(body)
    records[name]={'sha256':digest(body),'bytes':len(body)}
    if source_hash:records[name]['sourceSha256']=source_hash

def capture_route(route):
    raw=read(ORIGIN+route);s=raw.decode();
    if 'wp-admin-bar' in s:raise ValueError('Authenticated HTML cannot enter the preview')
    if route=='/' and re.search(r'class=["\']home-slideshow-controls["\']',s):raise ValueError('Home controls still present')
    contact=re.search(r'<dialog\b[^>]*id="contact-dialog"[^>]*>.*?</dialog>',s,re.S)
    if not contact or len(re.findall(r'<a\b',contact.group()))!=6:raise ValueError('Expected six current contact channels')
    name='index.html' if route=='/' else route.strip('/')+'/index.html'
    return name,rebase(s,True).encode(),digest(raw)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for name,body,original in pool.map(capture_route,ROUTES):write(name,body,original)

for name,meta in source_assets.items():
    if not name.startswith('_astro/'):continue
    raw=read(ORIGIN+RELEASE+name)
    if digest(raw)!=meta['sha256']:raise ValueError('Published asset changed '+name)
    body=rebase(raw.decode()).encode() if name.endswith(('.js','.css')) else raw
    write('_wordpress/'+name,body,digest(raw))

for name in ['services.css','contact-dialog.js']:
    raw=read(ORIGIN+'/wp-content/themes/rodeio-2026/'+name)
    if raw!=(ROOT/'wordpress'/name).read_bytes():raise ValueError('Local WordPress runtime differs '+name)
    write('_wordpress/'+name,rebase(raw.decode()).encode(),digest(raw))

# Record only public images/documents referenced by the exported HTML and runtime.
refs=set()
for name in records:
    if name.endswith(('.html','.js','.css')):
        text=html.unescape((DEST/'files'/name).read_text())
        for path in re.findall(r'/rodeio/((?:photos|logos|cardapio-paginas)/[^\s"\'<>`,)]+|(?:cardapio-rodeio\.pdf|og\.jpg|logo\.png|favicon\.png|apple-touch-icon\.png))',text):refs.add(path.split('?')[0].split('#')[0])
assets={}
for path in sorted(refs):
    meta=source_assets.get(path)
    if not meta:raise ValueError('Unknown published asset '+path)
    local=ROOT/'public'/path
    if not local.is_file() or digest(local.read_bytes())!=meta['sha256']:raise ValueError('Local asset differs from live '+path)
    assets[path]=meta
manifest={'source':ORIGIN,'release':'rodeio-20261028-seo','base':'/rodeio/','routes':ROUTES,'files':dict(sorted(records.items())),'publicAssets':assets,'formEndpoints':['/rodeio/api/contato','/rodeio/api/eventos']}
(DEST/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'routes':len(ROUTES),'snapshotFiles':len(records),'verifiedPublicAssets':len(assets)},ensure_ascii=False))
