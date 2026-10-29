<?php
/** Read-only, script-free preview of the current WordPress content, for the ACF editor. */
class Rodeio_Editor_Preview
{
    public static function document($id)
    {
        if (!Rodeio_Editor::supported($id) || $id===Rodeio_Editor_Data::id()) throw new RuntimeException('Prévia indisponível para esta área.');
        $snapshot=Rodeio_Editor::snapshot($id);
        $doc=new Rodeio_Editor_Document(Rodeio_Editor::fragment($snapshot['content']));
        $bindings=[];
        // Resolve all paths before inserting preview-only wrappers: the saved HTML never changes.
        foreach($snapshot['data'] as $kind=>$items) foreach($items as $index=>$item){
            $node=$doc->node(explode('@',$item['key'])[0]);
            if($node)$bindings[]=[$node,$kind.':'.$index];
        }
        $description=Rodeio_Editor_UI::describe($id);
        foreach($description['sections'] as $section){$node=$doc->node($section['key']);if($node instanceof DOMElement)$node->setAttribute('data-rde-section',$section['title']);}
        foreach($bindings as [$node,$key]){
            if($node instanceof DOMText){$span=$doc->dom->createElement('span');$span->setAttribute('data-rde-preview',$key);$node->parentNode->replaceChild($span,$node);$span->appendChild($node);}
            elseif($node instanceof DOMElement){$existing=$node->getAttribute('data-rde-preview');$node->setAttribute('data-rde-preview',trim($existing.' '.$key));}
        }
        // No executable content, navigation or form submission in the preview.
        foreach(iterator_to_array($doc->xpath->query('.//script | .//iframe | .//object | .//embed | .//base | .//meta | .//link | .//style',$doc->root)) as $node)$node->parentNode->removeChild($node);
        foreach($doc->xpath->query('.//*',$doc->root) as $node){
            foreach(iterator_to_array($node->attributes) as $attr)if(stripos($attr->name,'on')===0 || in_array($attr->name,['action','formaction','srcdoc'],true))$node->removeAttribute($attr->name);
            if($node->tagName==='a'){$node->setAttribute('data-rde-destination',$node->getAttribute('href'));$node->removeAttribute('href');$node->removeAttribute('target');}
            if(in_array($node->tagName,['input','select','textarea','button'],true))$node->setAttribute('disabled','disabled');
            if($node->tagName==='form')$node->setAttribute('inert','');
            if($node->tagName==='img'){if($node->hasAttribute('data-src'))$node->setAttribute('src',$node->getAttribute('data-src'));$node->setAttribute('loading','eager');$node->removeAttribute('srcset');}
            if($node->tagName==='source'){$node->removeAttribute('srcset');$node->removeAttribute('data-srcset');}
            if($node->tagName==='dialog')$node->setAttribute('open','');
        }
        $theme=get_template_directory();$runtime=file_get_contents($theme.'/functions.php');
        if(!preg_match('~/releases/([a-zA-Z0-9_-]+)/pages/~',$runtime,$m))throw new RuntimeException('Não foi possível localizar os estilos da versão publicada.');
        $route=trim(get_post_meta($id,'_rodeio_managed_route',true),'/');
        $file=($route===''?'home':str_replace('/','--',$route)).'.html.gz';
        $path=$theme.'/releases/'.$m[1].'/pages/'.$file;
        if(!is_file($path))$path=$theme.'/releases/'.$m[1].'/pages/home.html.gz';
        $shell=gzdecode(file_get_contents($path));$head='';
        preg_match_all('~<link\b[^>]*rel="stylesheet"[^>]*>|<style\b[^>]*>.*?</style>~s',$shell,$styles);
        foreach($styles[0] as $style){
            if(strpos($style,'<style')===0){$head.=$style;continue;}
            if(preg_match('~href="([^"]+)"~',$style,$url)){
                $href=html_entity_decode($url[1],ENT_QUOTES,'UTF-8');$parts=wp_parse_url($href);
                if((empty($parts['host']) || $parts['host']===wp_parse_url(home_url(),PHP_URL_HOST)) && strpos($parts['path']??'','/wp-content/themes/')===0)$head.='<link rel="stylesheet" href="'.esc_url($href).'">';
            }
        }
        $head.='<link rel="stylesheet" href="'.esc_url(get_template_directory_uri().'/services.css').'">';
        $main='';if(get_post_type($id)==='page'){$main='<main id="conteudo">';if(preg_match('~<main\b[^>]*>~',$shell,$match))$main=$match[0];}
        $policy="default-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'";
        $overrides='html{scroll-behavior:auto!important}body{margin:0!important;min-height:100vh!important}*{animation:none!important;transition:none!important;scroll-behavior:auto!important}[data-rde-preview]{cursor:pointer!important}[data-rde-preview]:hover{outline:2px dashed #b6803e!important;outline-offset:3px}.rde-preview-selected{outline:3px solid #c89348!important;outline-offset:4px;background-color:#c8934822!important}dialog[open]{position:relative!important;inset:auto!important;display:block!important;margin:24px auto!important;max-height:none!important;transform:none!important;opacity:1!important;width:calc(100% - 48px)!important}dialog[hidden]{display:none!important}[data-reveal],.reveal{opacity:1!important;transform:none!important}header{position:relative!important}footer{margin:0!important}form[inert]{opacity:.65}[data-hero-slide]{animation:none!important}';
        return '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'.esc_attr($policy).'">'.$head.'<style>'.$overrides.'</style></head><body>'.$main.$doc->html().($main?'</main>':'').'</body></html>';
    }
    public static function ajax()
    {
        $id=absint($_GET['post_id']??0);
        if(!current_user_can('edit_post',$id) || !current_user_can('manage_options'))wp_send_json_error(['message'=>'Acesso restrito.'],403);
        check_ajax_referer('rodeio-preview-'.$id);
        try{nocache_headers();wp_send_json_success(['html'=>self::document($id)]);}
        catch(Throwable $e){wp_send_json_error(['message'=>'Não foi possível carregar a prévia. Os campos continuam disponíveis.'],500);}
    }
}
add_action('wp_ajax_rodeio_editor_preview',['Rodeio_Editor_Preview','ajax']);
