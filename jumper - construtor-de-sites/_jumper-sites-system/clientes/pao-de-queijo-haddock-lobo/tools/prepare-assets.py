"""Inventory and optimize the client's supplied assets, preserving originals."""
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageOps, ImageDraw, ImageFont
import json, io, hashlib, shutil, sys

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / 'briefing/entrada'
SHEETS = ROOT / 'data/visual-review/acervo'
SOURCES = [
    ('agosto', Path('/Users/marajah/Downloads/260826-20261001T220041Z-1-001.zip')),
    ('junho', Path('/Users/marajah/Downloads/junho2026-20261001T220111Z-1-001.zip')),
    ('maio', Path('/Users/marajah/Downloads/05. Maio-20261001T220125Z-1-001.zip')),
]

def inventory():
    SHEETS.mkdir(parents=True, exist_ok=True)
    manifest = []
    thumbs = []
    for collection, archive in SOURCES:
        with ZipFile(archive) as z:
            photos = sorted(n for n in z.namelist() if n.lower().endswith(('.jpg', '.jpeg')) and not n.startswith('__MACOSX'))
            for i, name in enumerate(photos, 1):
                key = f'{collection}-{i:02d}'
                raw = z.read(name)
                im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
                manifest.append({'id': key, 'archive': str(archive), 'entry': name, 'width': im.width, 'height': im.height, 'sha256': hashlib.sha256(raw).hexdigest()})
                thumb = ImageOps.contain(im, (320, 240))
                tile = Image.new('RGB', (344, 284), '#EEECE8')
                tile.paste(thumb, ((344-thumb.width)//2, (240-thumb.height)//2+8))
                draw = ImageDraw.Draw(tile)
                draw.text((12, 254), key + ' / ' + Path(name).name[-30:], fill='#13273D')
                thumbs.append(tile)
    for offset in range(0, len(thumbs), 12):
        canvas = Image.new('RGB', (344*4, 284*3), '#EEECE8')
        for i, tile in enumerate(thumbs[offset:offset+12]):
            canvas.paste(tile, ((i%4)*344, (i//4)*284))
        canvas.save(SHEETS / f'acervo-{offset//12+1:02d}.jpg', quality=88)
    (INPUT / 'fotos-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f'{len(manifest)} photos; {len(range(0, len(thumbs), 12))} contact sheets')

def optimize():
    manifest = {p['id']: p for p in json.loads((INPUT/'fotos-manifest.json').read_text())}
    selections = json.loads((ROOT/'data/photo-selections.json').read_text())
    destination = ROOT/'public/images'
    destination.mkdir(parents=True, exist_ok=True)
    menu_only = '--menu-only' in sys.argv
    output = json.loads((destination/'manifest.json').read_text()) if menu_only else []
    if menu_only:
        output = [p for p in output if not p['file'].startswith(('bebidas-', 'smoothies-'))]
    for name, spec in selections.items():
        if menu_only or 'id' not in spec: continue
        p = manifest[spec['id']]
        with ZipFile(p['archive']) as z:
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(z.read(p['entry'])))).convert('RGB')
        # Preserve the full photograph. Responsive cropping is controlled by CSS.
        for width in [320, 640, 960, 1100, 1800]:
            size = min(width, im.width)
            image = ImageOps.contain(im, (size, size*2), Image.Resampling.LANCZOS)
            target = destination/f'{name}-{width}.webp'
            quality = 77
            image.save(target, quality=quality, method=6)
            while target.stat().st_size > 380*1024 and quality > 42:
                quality -= 6
                image.save(target, quality=quality, method=6)
            assert target.stat().st_size <= 400*1024, target.name
            output.append({'file': target.name, 'width': image.width, 'height': image.height, 'bytes': target.stat().st_size, 'source_id': p['id']})
        print(name, p['id'])
    (destination/'manifest.json').write_text(json.dumps(output, ensure_ascii=False, indent=2))
    for source in (INPUT/'site-atual').glob('*.jpg'):
        if menu_only and source.stem not in ('bebidas', 'smoothies'): continue
        im = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
        for width in [320, 640, 960, 1100, 1800]:
            image = ImageOps.contain(im, (min(width, im.width), min(width, im.width)*2), Image.Resampling.LANCZOS)
            target = destination/f'{source.stem}-{width}.webp'
            image.save(target, quality=74, method=6)
            output.append({'file': target.name, 'width': image.width, 'height': image.height, 'bytes': target.stat().st_size, 'source': str(source.relative_to(ROOT))})
    (destination/'manifest.json').write_text(json.dumps(output, ensure_ascii=False, indent=2))

def brand():
    im = Image.open(ROOT/'data/visual-review/logo-original.png').convert('RGB')
    im = im.crop((8, 8, im.width-8, im.height-8))
    background = im.getpixel((0, 0))
    mask = im.getchannel('R').point(lambda v: max(0, min(255, round((v-background[0])*255/(255-background[0])))))
    box = mask.getbbox()
    mask = mask.crop(box)
    destination = ROOT/'public/brand'
    destination.mkdir(parents=True, exist_ok=True)
    for name, color in [('logo-navy', '#13273D'), ('logo-white', '#FFFFFF')]:
        logo = Image.new('RGBA', mask.size, color)
        logo.putalpha(mask)
        logo.save(destination/f'{name}.png', optimize=True)
    # Crop only the official basket symbol above the lettering.
    symbol = mask.crop((0, 0, mask.width, round(mask.height*.44)))
    symbol = symbol.crop(symbol.getbbox())
    for name, color in [('symbol-navy', '#13273D'), ('symbol-white', '#FFFFFF')]:
        art = Image.new('RGBA', symbol.size, color)
        art.putalpha(symbol)
        art.save(destination/f'{name}.png', optimize=True)
    canvas = Image.new('RGBA', (128,128), '#13273D')
    white = Image.new('RGBA', symbol.size, '#FFFFFF')
    white.putalpha(symbol)
    white.thumbnail((90,90), Image.Resampling.LANCZOS)
    canvas.alpha_composite(white, ((128-white.width)//2, (128-white.height)//2))
    canvas.save(ROOT/'public/favicon.png')
    print('Official logo extracted', mask.size, 'symbol', symbol.size)

if __name__ == '__main__':
    if '--optimize' in sys.argv: optimize()
    elif '--brand' in sys.argv: brand()
    else: inventory()
