"""Lossless WOFF2 copies of the exact fonts supplied by the client.

Requires fonttools and brotli. Original TTFs are never modified or subsetted.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
import json

root = Path(__file__).resolve().parents[1]
fonts = root / 'src/assets/fonts'
report = []
for original in sorted(fonts.glob('*.ttf')):
    target = original.with_suffix('.woff2')
    font = TTFont(original)
    glyphs = font.getGlyphOrder()
    font.flavor = 'woff2'
    font.save(target)
    decoded = TTFont(target)
    assert decoded.getGlyphOrder() == glyphs
    assert decoded.getBestCmap() == font.getBestCmap()
    report.append({'font':original.stem, 'original_bytes':original.stat().st_size,
                   'woff2_bytes':target.stat().st_size, 'glyphs_preserved':len(glyphs)})
    print(f'{original.name}: {original.stat().st_size} → {target.stat().st_size} bytes')
(root / 'data/font-optimization.json').write_text(json.dumps(report, indent=2))
