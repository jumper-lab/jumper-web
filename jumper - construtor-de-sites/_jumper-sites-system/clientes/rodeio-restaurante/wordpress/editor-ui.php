<?php
/** Administration-only presentation. The field names and save pipeline stay native ACF. */
class Rodeio_Editor_UI
{
    public static function describe($id)
    {
        $snapshot = Rodeio_Editor::snapshot($id);
        $doc = new Rodeio_Editor_Document(Rodeio_Editor::fragment($snapshot['content']));
        $rows = [];
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
                $tag = $node instanceof DOMText ? $node->parentNode->nodeName : ($node ? $node->nodeName : '');
                $semantic = $node;
                while ($semantic && $semantic !== $section && !in_array($tag, ['h1','h2','h3','p','a','button','figcaption'], true)) {$semantic=$semantic->parentNode;$tag=$semantic ? $semantic->nodeName : '';}
                $type = ['h1'=>'Título principal', 'h2'=>'Título da seção', 'h3'=>'Subtítulo', 'p'=>'Parágrafo', 'a'=>'Texto do link', 'button'=>'Texto do botão', 'figcaption'=>'Legenda'];
                $label = $kind === 'texts' ? ($type[$tag] ?? 'Texto') : ['images'=>'Imagem', 'links'=>'Destino do link', 'menus'=>'Menu'][$kind];
                $rows[$kind][] = ['section'=>$name, 'label'=>$label, 'context'=>$item['context'] ?? '', 'key'=>$item['key']];
            }
        }
        $areas = [];
        foreach (get_option('_rde_fragment_ids', []) as $key=>$area) {
            $areas[] = ['label'=>get_the_title($area), 'url'=>get_edit_post_link($area, 'raw')];
        }
        return ['title'=>get_the_title($id), 'shared'=>get_post_type($id)==='rodeio_layout', 'rows'=>$rows, 'areas'=>$areas, 'preview'=>get_post_type($id)==='page' ? get_permalink($id) : home_url('/')];
    }
    public static function enqueue()
    {
        $screen = get_current_screen();
        $id = (int) ($_GET['post'] ?? ($_POST['post_ID'] ?? 0));
        if (!$screen || $screen->base !== 'post' || !Rodeio_Editor::supported($id)) return;
        try {
            $config = self::describe($id);
        } catch (Throwable $e) { return; }
        wp_enqueue_style('rodeio-editor-studio', get_template_directory_uri().'/editor-ui.css', ['acf-input'], filemtime(__DIR__.'/editor-ui.css'));
        wp_enqueue_script('rodeio-editor-studio', get_template_directory_uri().'/editor-ui.js', ['acf-input'], filemtime(__DIR__.'/editor-ui.js'), true);
        wp_add_inline_script('rodeio-editor-studio', 'window.rodeioEditorStudio='.wp_json_encode($config, JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';', 'before');
    }
}
