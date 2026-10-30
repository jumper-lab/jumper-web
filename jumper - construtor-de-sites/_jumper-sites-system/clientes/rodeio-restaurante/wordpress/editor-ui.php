<?php
require_once __DIR__ . "/editor-form.php";
/** Administration-only presentation. The field names and save pipeline stay native ACF. */
class Rodeio_Editor_UI
{
    public static function describe($id)
    {
        $snapshot = Rodeio_Editor::snapshot($id);
        $doc = new Rodeio_Editor_Document(Rodeio_Editor::fragment($snapshot['content']));
        $rows = [];
        $sections = [];
        $facts = Rodeio_Editor::settings();
        $settings_url = get_edit_post_link(Rodeio_Editor_Data::id(), 'raw');
        foreach ($snapshot['data'] as $kind => $items) {
            foreach ($items as $item) {
                $path = explode('@', $item['key'])[0];
                $node = $doc->node($path);
                $section = $node;
                while ($section && $section !== $doc->root && !in_array($section->nodeName, ['section', 'dialog', 'header', 'footer', 'nav'], true) && !($section instanceof DOMElement && preg_match('/(?:^| )footer-(?:unit|contact|signoff|bottom)(?: |$)/', $section->getAttribute('class')))) {
                    $section = $section->parentNode;
                }
                $name = 'Conteúdo principal';
                if ($section && $section !== $doc->root) {
                    $head = $doc->xpath->query('.//h1 | .//h2 | .//h3', $section)->item(0);
                    $name = $head ? implode(' ', array_map(static function($text){return trim($text->nodeValue);}, iterator_to_array($doc->xpath->query('.//text()', $head)))) : ($section->getAttribute('aria-label') ?: ['header'=>'Cabeçalho', 'footer'=>'Rodapé', 'nav'=>'Navegação', 'dialog'=>'Janela de conteúdo', 'section'=>'Seção da página', 'div'=>'Marca e informações do rodapé'][$section->nodeName]);
                    if ($section->nodeName === 'dialog' && $section->getAttribute('id') === 'navigation-dialog') $name = 'Menu mobile';
                }
                $name = trim(preg_replace('/\s+/u', ' ', $name));
                $section_path = ($section && $section !== $doc->root) ? $section->getNodePath() : $doc->root->getNodePath();
                if (!isset($sections[$section_path])) {
                    $original_name=$name; $number=1;
                    while(in_array($name,array_column($sections,'title'),true))$name=$original_name.' · '.(++$number);
                    $picture=$doc->xpath->query('.//img',$section ?: $doc->root)->item(0);
                    $excerpt=$doc->xpath->query('.//p',$section ?: $doc->root)->item(0);
                    $sections[$section_path]=['key'=>$section_path,'title'=>$name,'image'=>$picture ? $picture->getAttribute('src') : '', 'excerpt'=>$excerpt ? mb_substr(trim(preg_replace('/\s+/u',' ',$excerpt->textContent)),0,150) : '','counts'=>[]];
                }
                $name=$sections[$section_path]['title'];
                $sections[$section_path]['counts'][$kind]=1+($sections[$section_path]['counts'][$kind]??0);
                $tag = $node instanceof DOMText ? $node->parentNode->nodeName : ($node ? $node->nodeName : '');
                $semantic = $node;
                while ($semantic && $semantic !== $section && !in_array($tag, ['h1','h2','h3','p','a','button','figcaption'], true)) {$semantic=$semantic->parentNode;$tag=$semantic ? $semantic->nodeName : '';}
                $type = ['h1'=>'Título principal', 'h2'=>'Título da seção', 'h3'=>'Subtítulo', 'p'=>'Parágrafo', 'a'=>'Texto do link', 'button'=>'Texto do botão', 'figcaption'=>'Legenda'];
                $label = $kind === 'texts' ? ($type[$tag] ?? 'Texto') : ['images'=>'Imagem', 'links'=>'Destino do link', 'menus'=>'Menu'][$kind];
                $shared = null;$shared_field=null;
                $value = $kind === 'texts' ? ($item['value'] ?? null) : ($kind === 'links' ? ($item['url'] ?? null) : null);
                foreach ($facts as $fact_key=>$fact) if ($value !== null && ($value === $fact['value'] || ($kind==='texts' && $fact_key==='phone_display' && mb_strlen($value)<=100 && strpos($value,$fact['value'])!==false)) && isset(Rodeio_Editor_Data::schema()[$fact_key==='phone'?'phone_display':$fact_key])) {
                    $shared_field=$fact_key==='phone'?'phone_display':$fact_key;
                    $shared = Rodeio_Editor_Data::schema()[$shared_field][0]; $label = $shared; break;
                }
                if($kind==='texts' && isset($facts['whatsapp']) && preg_match('/^[+()0-9\s.-]+$/u',(string)$value) && preg_replace('/\D/','',(string)$value)===preg_replace('/\D/','',$facts['whatsapp']['value'])) {$shared='WhatsApp do delivery';$label=$shared;$shared_field='whatsapp';}
                if($kind==='links' && preg_match('~/cardapio-rodeio\.pdf(?:[?#]|$)~',(string)$value)){$shared='PDF do cardápio';$label=$shared;$shared_field='menu_pdf';}
                $control = $node instanceof DOMElement ? $node : ($node ? $node->parentNode : null);
                $technical = strpos($item['key'], '@data-menu-') !== false;
                for ($p=$control;$p && $p!==$doc->root;$p=$p->parentNode) if ($p instanceof DOMElement && ($p->tagName==='noscript'||$p->hasAttribute('data-close-digital-menu') || $p->hasAttribute('data-close-gallery') || $p->hasAttribute('data-close-service') || $p->hasAttribute('data-close-contact') || $p->getAttribute('id')==='gallery-dialog')) $technical=true;
                $rows[$kind][] = ['section'=>$name, 'sectionKey'=>$section_path, 'label'=>$label, 'context'=>$item['context'] ?? '', 'key'=>$item['key'], 'shared'=>$shared,'sharedField'=>$shared_field, 'settingsUrl'=>$shared==='PDF do cardápio' ? Rodeio_Menu_Pdf::page_url() : $settings_url, 'settingsLabel'=>$shared==='PDF do cardápio' ? 'PDF do cardápio' : 'Dados e contatos', 'technical'=>$technical];
            }
        }
        $areas = [];
        foreach (get_option('_rde_fragment_ids', []) as $key=>$area) {
            $title=Rodeio_Editor_Dashboard::areas()[$key]['title']??get_the_title($area);
            $areas[] = ['label'=>$title, 'url'=>get_edit_post_link($area, 'raw')];
        }
        return ['blocks'=>Rodeio_Editor_Form::describe($doc,$snapshot,$rows), 'menuPdfUrl'=>Rodeio_Menu_Pdf::page_url(), 'id'=>(int)$id, 'sections'=>array_values($sections), 'previewEndpoint'=>add_query_arg(['action'=>'rodeio_editor_preview','post_id'=>(int)$id,'_wpnonce'=>wp_create_nonce('rodeio-preview-'.$id)],admin_url('admin-ajax.php')), 'title'=>get_the_title($id), 'shared'=>get_post_type($id)==='rodeio_layout', 'rows'=>$rows, 'areas'=>$areas, 'defaultSection'=>get_post_meta($id,'_rde_fragment_type',true)==='dialogs' ? 'Fale com a gente' : '', 'preview'=>get_post_type($id)==='page' ? get_permalink($id) : home_url('/')];
    }
    public static function enqueue()
    {
        $screen = get_current_screen();
        $id = (int) ($_GET['post'] ?? ($_POST['post_ID'] ?? 0));
        if (!$screen || $screen->base !== 'post' || !Rodeio_Editor::supported($id)) return;
        try {
            $config = self::describe($id);
        } catch (Throwable $e) { return; }
        if($config['shared'])$config['title']=Rodeio_Editor_Dashboard::areas()[get_post_meta($id,'_rde_fragment_type',true)]['title']??$config['title'];
        if ($id === Rodeio_Editor_Data::id()) {
            wp_enqueue_style('rodeio-editor-studio',get_template_directory_uri().'/editor-ui.css',['acf-input'],filemtime(__DIR__.'/editor-ui.css'));
            wp_enqueue_style('rodeio-editor-brand',get_template_directory_uri().'/editor-brand.css',['rodeio-editor-studio'],filemtime(__DIR__.'/editor-brand.css'));
            $config['dataFields']=[];foreach(Rodeio_Editor_Data::schema() as $key=>$field)$config['dataFields'][]=['key'=>$key,'label'=>$field[0],'tab'=>in_array($field[2],['general','orders'],true)?'general':$field[2]];
            self::preview_assets($config,['acf-input']);return;
        }
        $header=(int)(get_option('_rde_fragment_ids',[])['header']??0);
        $config['brandLogo']=$header?(Rodeio_Editor::snapshot($header)['data']['images'][0]['url']??''):'';
        wp_enqueue_media();
        wp_enqueue_style('rodeio-editor-form',get_template_directory_uri().'/editor-form.css',['acf-input'],filemtime(__DIR__.'/editor-form.css'));
        wp_enqueue_style('rodeio-editor-brand',get_template_directory_uri().'/editor-brand.css',['rodeio-editor-form'],filemtime(__DIR__.'/editor-brand.css'));
        wp_enqueue_script('rodeio-editor-studio',get_template_directory_uri().'/editor-form.js',['acf-input','media-editor'],filemtime(__DIR__.'/editor-form.js'),true);
        wp_add_inline_script('rodeio-editor-studio', 'window.rodeioEditorStudio='.wp_json_encode($config, JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';', 'before');
        self::preview_assets($config,['rodeio-editor-studio']);
    }
    private static function preview_assets($config,$dependencies)
    {
        wp_enqueue_style('rodeio-editor-devices',get_template_directory_uri().'/editor-device-preview.css',['rodeio-editor-brand'],filemtime(__DIR__.'/editor-device-preview.css'));
        wp_enqueue_script('rodeio-editor-devices',get_template_directory_uri().'/editor-device-preview.js',$dependencies,filemtime(__DIR__.'/editor-device-preview.js'),true);
        wp_add_inline_script('rodeio-editor-devices','window.rodeioDevicePreview='.wp_json_encode($config,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';','before');
    }
}

add_filter('admin_body_class', static function($classes) {
    $id=(int)($_GET['post']??0);
    if (get_post_type($id)==='rodeio_layout') {
        $classes.=' rde-managed-shared';
        if($id===Rodeio_Editor_Data::id())$classes.=' rde-data-screen';
    }
    return $classes;
});
