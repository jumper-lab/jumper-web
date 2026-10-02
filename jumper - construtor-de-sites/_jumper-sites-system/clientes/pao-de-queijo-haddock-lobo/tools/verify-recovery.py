"""Actually extract and hash-check the local pre-construction archive.

This does not claim to back up or restore the public WordPress site.
"""
from pathlib import Path
import tempfile, tarfile, hashlib, json, sys

root = Path(__file__).resolve().parents[1]
hero_revision = '--hero' in sys.argv
bugfix_revision = '--correcoes' in sys.argv
type_revision = '--tipografia-hover' in sys.argv
delivery_revision = '--delivery' in sys.argv
internal_revision = '--internas' in sys.argv
split_revision = '--internas-divididas' in sys.argv
menu_revision = '--cardapio' in sys.argv
contact_revision = '--contatos' in sys.argv
events_revision = '--eventos' in sys.argv
form_revision = '--form-contato' in sys.argv
drinks_revision = '--fotos-cardapio' in sys.argv
lightbox_revision = '--lightbox-cardapio' in sys.argv
menu_icons_revision = '--icones-cardapio' in sys.argv
store_swipe_revision = '--swipe-lojas' in sys.argv
fullscreen_menu_revision = '--menu-fullscreen' in sys.argv
index_stability_revision = '--indice-estavel' in sys.argv
history_marks_revision = '--numeros-historia' in sys.argv
archive = root/('briefing/entrada/estado-pre-internas-divididas-2026-10-02.tar.gz' if split_revision else 'briefing/entrada/estado-pre-internas-2026-10-02.tar.gz' if internal_revision else 'briefing/entrada/estado-pre-delivery-2026-10-02.tar.gz' if delivery_revision else 'briefing/entrada/estado-pre-tipografia-hover-2026-10-02.tar.gz' if type_revision else 'briefing/entrada/estado-pre-correcoes-2026-10-02.tar.gz' if bugfix_revision else 'briefing/entrada/estado-pre-hero-2026-10-02.tar.gz' if hero_revision else 'briefing/entrada/estado-pre-construcao-2026-10-01.tar.gz')
if menu_revision:
    archive = root/'briefing/entrada/estado-pre-cardapio-2026-10-02.tar.gz'
if contact_revision:
    archive = root/'briefing/entrada/estado-pre-contatos-2026-10-02.tar.gz'
if events_revision:
    archive = root/'briefing/entrada/estado-pre-eventos-2026-10-02.tar.gz'
if form_revision:
    archive = root/'briefing/entrada/estado-pre-form-contato-2026-10-02.tar.gz'
if drinks_revision:
    archive = root/'briefing/entrada/estado-pre-fotos-cardapio-2026-10-02.tar.gz'
if lightbox_revision:
    archive = root/'briefing/entrada/estado-pre-lightbox-cardapio-2026-10-02.tar.gz'
if menu_icons_revision:
    archive = root/'briefing/entrada/estado-pre-icones-cardapio-2026-10-02.tar.gz'
if store_swipe_revision:
    archive = root/'briefing/entrada/estado-pre-swipe-lojas-2026-10-02.tar.gz'
if fullscreen_menu_revision:
    archive = root/'briefing/entrada/estado-pre-menu-fullscreen-2026-10-02.tar.gz'
if index_stability_revision:
    archive = root/'briefing/entrada/estado-pre-estabilidade-indice-2026-10-02.tar.gz'
if history_marks_revision:
    archive = root/'briefing/entrada/estado-pre-alinhamento-numeros-2026-10-02.tar.gz'
destination = Path(tempfile.mkdtemp(prefix='jumper-pao-recovery-', dir='/private/tmp'))
checked = []
with tarfile.open(archive, 'r:gz') as source:
    members = source.getmembers()
    for member in members:
        resolved = (destination/member.name).resolve()
        assert resolved.is_relative_to(destination), member.name
        assert member.isfile() or member.isdir(), member.name
    if sys.version_info >= (3, 12):
        source.extractall(destination, members=members, filter='data')
    else:
        # Older macOS Python: all paths and file-only member types were checked above.
        source.extractall(destination, members=members)
    for member in members:
        if not member.isfile(): continue
        expected = hashlib.sha256(source.extractfile(member).read()).hexdigest()
        restored = hashlib.sha256((destination/member.name).read_bytes()).hexdigest()
        assert expected == restored, member.name
        checked.append({'file':member.name, 'sha256':restored, 'status':'passed'})
content_files = [entry for entry in checked if not Path(entry['file']).name.startswith('._')]
if history_marks_revision:
    assert '<strong>+ 3.000</strong>' in (destination/'src/pages/sobre.astro').read_text()
    assert (destination/'src/scripts/menu-index.ts').exists()
    assert '.history-marks strong{font-size:clamp(40px,10vw,56px)}' in (destination/'src/styles/global.css').read_text()
elif index_stability_revision:
    assert (destination/'src/styles/mobile-menu.css').exists()
    assert '@media(max-height:540px){:root{--header:76px}' in (destination/'src/styles/atelier.css').read_text()
    assert "rootMargin:'-24% 0px -60% 0px'" in (destination/'src/scripts/site.ts').read_text()
elif fullscreen_menu_revision:
    assert not (destination/'src/styles/mobile-menu.css').exists()
    assert (destination/'src/scripts/store-swipe.ts').exists()
elif store_swipe_revision:
    assert not (destination/'src/scripts/store-swipe.ts').exists()
    assert 'data-store-swipe-note' not in (destination/'src/components/StoreFinder.astro').read_text()
    assert 'delivery-ifood.png' in (destination/'src/pages/menu.astro').read_text()
elif menu_icons_revision:
    assert 'delivery-ifood.png' not in (destination/'src/pages/menu.astro').read_text()
    assert (destination/'src/components/MenuPhoto.astro').exists()
elif lightbox_revision:
    assert (destination/'src/pages/menu.astro').exists()
    assert not (destination/'src/components/MenuPhoto.astro').exists()
    assert all(c['image'] for c in json.loads((destination/'data/content.json').read_text())['menu']['categories'])
    assert 'id="expanded-photo"' in (destination/'src/layouts/SiteLayout.astro').read_text()
elif drinks_revision:
    previous = json.loads((destination/'data/content.json').read_text())
    assert all(c['image'] is None for c in previous['menu']['categories'] if c['id'] in ('bebidas','smoothies'))
    assert not any(p['file'].startswith(('bebidas-', 'smoothies-')) for p in json.loads((destination/'public/images/manifest.json').read_text()))
    assert (destination/'src/scripts/contact-form.ts').exists()
elif form_revision:
    assert {'src/components/Contact.astro','src/styles/contact.css','jumper.config.json',
            'data/content.json','data/final-design-system.json','data/final-site-build-prompt.md',
            'data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'data-contact-email' in (destination/'src/components/Contact.astro').read_text()
    assert 'data-contact-form' not in (destination/'src/components/Contact.astro').read_text()
    assert not (destination/'src/scripts/contact-form.ts').exists()
elif events_revision:
    assert {'src/components/Events.astro','src/components/Contact.astro','src/styles/contact.css',
            'data/content.json','data/final-design-system.json','data/final-site-build-prompt.md',
            'data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'full-screen-events' not in (destination/'src/components/Events.astro').read_text()
    assert not (destination/'src/styles/events.css').exists()
    assert '<Contact/>' in (destination/'src/pages/index.astro').read_text()
elif contact_revision:
    assert {'src/pages/index.astro','src/layouts/SiteLayout.astro','src/components/FoodIcon.astro',
            'src/styles/menu-highlight.css','data/content.json','data/final-design-system.json',
            'data/final-site-build-prompt.md','data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert '<Contact/>' not in (destination/'src/pages/index.astro').read_text()
    assert '<footer class="site-footer" id="contatos">' in (destination/'src/layouts/SiteLayout.astro').read_text()
elif menu_revision:
    assert {'src/pages/index.astro','src/pages/menu.astro','src/components/PageHero.astro',
            'src/styles/page-hero.css','data/content.json','data/final-design-system.json',
            'data/final-site-build-prompt.md','data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'DÁ VONTADE DE' in (destination/'src/pages/index.astro').read_text()
    assert 'FoodIcon' not in (destination/'src/pages/index.astro').read_text()
    assert 'split-page-hero' in (destination/'src/components/PageHero.astro').read_text()
elif split_revision:
    assert {'src/components/PageHero.astro','src/styles/page-hero.css',
            'src/layouts/SiteLayout.astro','src/scripts/motion.ts',
            'data/final-design-system.json','data/final-site-build-prompt.md',
            'data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'immersive-page-hero' in (destination/'src/components/PageHero.astro').read_text()
    assert 'page-light-shield' in (destination/'src/styles/page-hero.css').read_text()
elif internal_revision:
    assert {'src/pages/sobre.astro','src/pages/menu.astro','src/pages/lojas.astro',
            'src/layouts/SiteLayout.astro','src/styles/atelier.css','src/styles/delivery.css',
            'data/final-design-system.json','data/final-site-build-prompt.md',
            'data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert '55vw' in (destination/'src/pages/sobre.astro').read_text()
    assert 'immersive-page-hero' not in (destination/'src/pages/sobre.astro').read_text()
elif delivery_revision:
    assert {'src/pages/index.astro','src/styles/atelier.css','data/content.json',
            'data/final-design-system.json','data/final-site-build-prompt.md',
            'data/visual-quality-audit.json','data/design-system-previews/final-design-system-preview.html',
            'README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'Prefere pedir agora?' in (destination/'src/pages/index.astro').read_text()
    assert 'padding:.30em .02em .20em' in (destination/'src/styles/atelier.css').read_text()
elif type_revision:
    assert {'src/components/NavPrint.astro','src/scripts/motion.ts','src/styles/atelier.css',
            'data/content.json','data/final-design-system.json','data/final-site-build-prompt.md',
            'data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'width:170%' in (destination/'src/styles/atelier.css').read_text()
    assert 'padding-top:8px;padding-bottom:3px' in (destination/'src/styles/atelier.css').read_text()
elif bugfix_revision:
    assert {'src/components/HomeHero.astro','src/scripts/slideshow.ts','src/styles/atelier.css',
            'data/final-design-system.json','data/final-site-build-prompt.md','data/visual-quality-audit.json',
            'data/design-system-previews/final-design-system-preview.html','README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'A pausa paulistana.' in (destination/'src/components/HomeHero.astro').read_text()
    assert 'photographic-breath' in (destination/'src/styles/atelier.css').read_text()
    assert '--print-cut' in (destination/'src/styles/atelier.css').read_text()
elif hero_revision:
    assert {'src/pages/index.astro','src/layouts/SiteLayout.astro','src/styles/global.css',
            'src/scripts/site.ts','data/final-design-system.json',
            'data/final-site-build-prompt.md','data/visual-quality-audit.json','README.md'}.issubset({entry['file'] for entry in content_files})
    assert 'hero-copy' in (destination/'src/pages/index.astro').read_text()
    assert 'HomeHero' not in (destination/'src/pages/index.astro').read_text()
    assert json.loads((destination/'data/final-design-system.json').read_text())['client_truth']['model']=='M5'
else:
    assert {entry['file'] for entry in content_files} == {
    'data/content.json', 'data/final-design-system.json', 'data/design-system.json',
    'data/design-system-previews/final-design-system-preview.html',
    'data/design-system-previews/initial-design-system-preview.html',
    'jumper.config.json', 'briefing/briefing-normalizado.md', 'briefing/briefing-payload.json'
    }
    assert (destination/'briefing/briefing-payload.json').read_bytes() == (root/'briefing/briefing-payload.json').read_bytes()
report = {'status':'passed', 'scope':'local_pre_split_internal_hero_files_only' if split_revision else 'local_pre_internal_hero_files_only' if internal_revision else 'local_pre_delivery_files_only' if delivery_revision else 'local_pre_typography_hover_files_only' if type_revision else 'local_pre_bugfix_revision_files_only' if bugfix_revision else 'local_pre_hero_revision_files_only' if hero_revision else 'local_pre_construction_files_only',
          'archive':str(archive.relative_to(root)), 'archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
          'recovered_to':str(destination), 'files':content_files, 'metadata_files_verified':len(checked)-len(content_files), 'original_briefing_preserved':not (hero_revision or bugfix_revision or type_revision or delivery_revision or internal_revision or split_revision),
          'public_wordpress_restore':'not_applicable_to_isolated_local_preview; required before any future official cutover'}
if menu_revision:
    report['scope'] = 'local_pre_menu_highlight_files_only'
    report['original_briefing_preserved'] = False
if contact_revision:
    report['scope'] = 'local_pre_contact_section_files_only'
    report['original_briefing_preserved'] = False
if events_revision:
    report['scope'] = 'local_pre_events_fold_files_only'
    report['original_briefing_preserved'] = False
if form_revision:
    report['scope'] = 'local_pre_contact_form_files_only'
    report['original_briefing_preserved'] = False
if drinks_revision:
    report['scope'] = 'local_pre_menu_drinks_photos_files_only'
    report['original_briefing_preserved'] = False
if lightbox_revision:
    report['scope'] = 'local_pre_menu_lightbox_files_only'
    report['original_briefing_preserved'] = False
if menu_icons_revision:
    report['scope'] = 'local_pre_menu_delivery_icons_files_only'
    report['original_briefing_preserved'] = False
if store_swipe_revision:
    report['scope'] = 'local_pre_store_swipe_files_only'
    report['original_briefing_preserved'] = False
if fullscreen_menu_revision:
    report['scope'] = 'local_pre_fullscreen_mobile_menu_files_only'
    report['original_briefing_preserved'] = False
if index_stability_revision:
    report['scope'] = 'local_pre_menu_index_stability_files_only'
    report['original_briefing_preserved'] = False
if history_marks_revision:
    report['scope'] = 'local_pre_history_marks_alignment_files_only'
    report['original_briefing_preserved'] = False
    (root/'data/visual-review'/'history-marks-recovery-report.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'status':report['status'], 'files_verified':len(content_files), 'recovered_to':str(destination)}))
    sys.exit(0)
(root/'data/visual-review'/('menu-stability-recovery-report.json' if index_stability_revision else 'mobile-menu-recovery-report.json' if fullscreen_menu_revision else 'store-swipe-recovery-report.json' if store_swipe_revision else 'menu-icons-recovery-report.json' if menu_icons_revision else 'menu-lightbox-recovery-report.json' if lightbox_revision else 'menu-drinks-recovery-report.json' if drinks_revision else 'contact-form-recovery-report.json' if form_revision else 'events-recovery-report.json' if events_revision else 'contact-recovery-report.json' if contact_revision else 'menu-recovery-report.json' if menu_revision else 'internal-split-recovery-report.json' if split_revision else 'internal-recovery-report.json' if internal_revision else 'delivery-recovery-report.json' if delivery_revision else 'typography-hover-recovery-report.json' if type_revision else 'bugfix-recovery-report.json' if bugfix_revision else 'hero-recovery-report.json' if hero_revision else 'recovery-report.json')).write_text(json.dumps(report,indent=2))
print(json.dumps({'status':report['status'], 'files_verified':len(content_files), 'recovered_to':str(destination)}))
