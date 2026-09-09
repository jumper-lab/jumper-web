from pathlib import Path
import json, subprocess, concurrent.futures, shutil
root=Path(__file__).resolve().parents[1]
items=json.loads((root/'briefing/entrada/drive-inventory.json').read_text())
selection={'jardinsHero':'BMM_56.jpg','historiaHero':'BMM_70.jpg','cardapioHero':'3M7A6310-Edit.jpg','livroCardapio':'rodeio (17).jpg','carneDetalhe':'rodeio (16).jpg','sobremesaServico':'rodeio (41).jpg','mesaDetalhe':'BMM_53.jpg','jardinsDirectory':'BMM_33.jpg','iguatemiDirectory':'rodeio (25).jpg','jardinsGallery':'BMM_30.jpg','jardinsSala':'BMM_37.jpg','iguatemiHero':'rodeio (27).jpg','iguatemiAcervo':'3M7A6368.jpg','reservasHero':'BMM_34.jpg','jardinsJanela':'BMM_75.jpg','jardinsMesaDois':'BMM_62.jpg','jardinsMesaNoite':'BMM_64.jpg','jardinsPassagem':'BMM_58.jpg','jardinsLounge':'BMM_29.jpg'}
records=[]
for key,name in selection.items():
 item=next(x for x in items if x['title']==name);records.append({'key':key,**item,'local':f'briefing/entrada/originais/{key}.jpg'})
(root/'briefing/entrada/photo-refresh-selection.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
def download(r):
 path=root/r['local']
 if not path.exists():
  subprocess.run(['curl','-sS','-L','--fail','--max-time','120','https://drive.google.com/uc?export=download&id='+r['id'],'-o',str(path)],check=True)
 if path.read_bytes()[:2]!=b'\xff\xd8': raise ValueError(f"Not JPEG: {r['key']}")
 print(r['key'],path.stat().st_size,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(download,records))
