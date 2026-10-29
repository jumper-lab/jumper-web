<?php
require_once __DIR__ . "/menu-pdf.php";
/** Read-only, script-free preview of the current WordPress content, for the ACF editor. */
class Rodeio_Editor_Preview
{
    public static function document($id,$context='general')
    {
        if (!Rodeio_Editor::supported($id)) throw new RuntimeException('Prévia indisponível para esta área.');
        $data=$id===Rodeio_Editor_Data::id();$source_id=$id;
        if($data){
            if(!in_array($context,['general','jardins','iguatemi'],true))throw new RuntimeException('Contexto inválido.');
            $source_id=$context==='general'?(int)(get_option('_rde_fragment_ids',[])['footer']??0):($context==='jardins'?823:824);
        }
        $snapshot=Rodeio_Editor::snapshot($source_id);
        $doc=new Rodeio_Editor_Document(Rodeio_Editor::fragment($snapshot['content']));
        if($data && $context!=='general'){
            $node=$doc->xpath->query('.//*[contains(concat(" ",normalize-space(@class)," ")," visit-heading ")]',$doc->root)->item(0);
            while($node && $node->nodeName!=='section')$node=$node->parentNode;
            if($node)$doc=new Rodeio_Editor_Document($doc->dom->saveHTML($node));
        }
        $bindings=[];
        // Resolve all paths before inserting preview-only wrappers: the saved HTML never changes.
        foreach($data?[]:$snapshot['data'] as $kind=>$items) foreach($items as $index=>$item){
            $node=$doc->node(explode('@',$item['key'])[0]);
            if($node)$bindings[]=[$node,$kind.':'.$index];
        }
        if(!$data){$description=Rodeio_Editor_UI::describe($id);
        foreach($description['sections'] as $section){$node=$doc->node($section['key']);if($node instanceof DOMElement)$node->setAttribute('data-rde-section',$section['title']);}}
        foreach($bindings as [$node,$key]){
            if($node instanceof DOMText){$span=$doc->dom->createElement('span');$span->setAttribute('data-rde-preview',$key);$node->parentNode->replaceChild($span,$node);$span->appendChild($node);}
            elseif($node instanceof DOMElement){$existing=$node->getAttribute('data-rde-preview');$node->setAttribute('data-rde-preview',trim($existing.' '.$key));
                if(strpos($key,'menus:')===0)foreach($doc->xpath->query('.//a',$node) as $i=>$anchor)$anchor->setAttribute('data-rde-menu-item',(string)$i);
            }
        }
        if($data){
            $facts=Rodeio_Editor::settings();
            foreach(iterator_to_array($doc->xpath->query('.//a[@href]',$doc->root)) as $anchor)foreach($facts as $key=>$fact){$field=$key==='phone'?'phone_display':$key;if(!isset(Rodeio_Editor_Data::schema()[$field]))continue;if($fact['kind']==='url'&&$anchor->getAttribute('href')===$fact['value']){$anchor->setAttribute('data-rde-setting-preview',$field);$anchor->setAttribute('data-rde-setting-kind','link');}}
            foreach(iterator_to_array($doc->xpath->query('.//text()[normalize-space()]',$doc->root)) as $text){
                if($doc->ancestor($text,static fn($p)=>in_array($p->tagName,['script','style','svg'],true)))continue;
                foreach($facts as $key=>$fact){if(!isset(Rodeio_Editor_Data::schema()[$key])||$fact['kind']!=='text'||trim($text->nodeValue)!==$fact['value'])continue;
                    $span=$doc->dom->createElement('span');$span->setAttribute('data-rde-setting-preview',$key);$span->setAttribute('data-rde-setting-kind','text');$text->parentNode->replaceChild($span,$text);$span->appendChild($text);break;
                }
            }
        }
        // No executable content, navigation or form submission in the preview.
        foreach(iterator_to_array($doc->xpath->query('.//iframe',$doc->root)) as $iframe){
            $placeholder=$doc->dom->createElement('div');$placeholder->setAttribute('class','rde-embedded-preview');
            if($iframe->hasAttribute('data-rde-preview'))$placeholder->setAttribute('data-rde-preview',$iframe->getAttribute('data-rde-preview'));
            $placeholder->appendChild($doc->dom->createTextNode('Sistema de reservas · clique aqui para editar o endereço de destino.'));
            $iframe->parentNode->replaceChild($placeholder,$iframe);
        }
        foreach(iterator_to_array($doc->xpath->query('.//script | .//iframe | .//object | .//embed | .//base | .//meta | .//link | .//style',$doc->root)) as $node)$node->parentNode->removeChild($node);
        foreach($doc->xpath->query('.//*',$doc->root) as $node){
            foreach(iterator_to_array($node->attributes) as $attr)if(stripos($attr->name,'on')===0 || in_array($attr->name,['action','formaction','srcdoc'],true))$node->removeAttribute($attr->name);
            if($node->tagName==='a'){$node->setAttribute('data-rde-destination',$node->getAttribute('href'));$node->removeAttribute('href');$node->removeAttribute('target');}
            if(in_array($node->tagName,['input','select','textarea'],true))$node->setAttribute('disabled','disabled');
            if($node->tagName==='button'){$node->setAttribute('type','button');$node->removeAttribute('disabled');}
            if($node->tagName==='img'){if($node->hasAttribute('data-src'))$node->setAttribute('src',$node->getAttribute('data-src'));$node->setAttribute('loading','eager');$node->removeAttribute('srcset');}
            if($node->tagName==='source'){if($node->hasAttribute('data-srcset'))$node->setAttribute('srcset',$node->getAttribute('data-srcset'));$node->removeAttribute('data-srcset');}
            if($node->tagName==='dialog')$node->setAttribute('open','');
        }
        $theme=get_template_directory();$runtime=file_get_contents($theme.'/functions.php');
        if(!preg_match('~/releases/([a-zA-Z0-9_-]+)/pages/~',$runtime,$m))throw new RuntimeException('Não foi possível localizar os estilos da versão publicada.');
        $route=trim(get_post_meta($source_id,'_rodeio_managed_route',true),'/');
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
        $main='';if(get_post_type($source_id)==='page'){$main='<main id="conteudo">';if(preg_match('~<main\b[^>]*>~',$shell,$match))$main=$match[0];}
        $policy="default-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'";
        $overrides='html{scroll-behavior:auto!important}body{margin:0!important;min-height:100vh!important}*{animation:none!important;transition:none!important;scroll-behavior:auto!important}[data-rde-preview],[data-rde-setting-preview]{cursor:pointer!important}[data-rde-preview]:hover,[data-rde-setting-preview]:hover{outline:2px dashed #b6803e!important;outline-offset:3px}.rde-preview-selected{outline:3px solid #c89348!important;outline-offset:4px;background-color:#c8934822!important}dialog[open]{position:relative!important;inset:auto!important;display:block!important;margin:24px auto!important;max-height:none!important;transform:none!important;opacity:1!important;width:calc(100% - 48px)!important}dialog[hidden]{display:none!important}[data-reveal],.reveal{opacity:1!important;transform:none!important}header{position:relative!important}footer{margin:0!important}[data-hero-slide]{animation:none!important}input,select,textarea{pointer-events:none!important}';
        $overrides.='.rde-embedded-preview{display:grid;place-items:center;min-height:240px;padding:28px;text-align:center;background:#f1e8da;border:1px dashed #aa8053;color:#63442d;font:16px/1.7 Arial,sans-serif}';
        $html='<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'.esc_attr($policy).'">'.$head.'<style>'.$overrides.'</style></head><body>'.$main.$doc->html().($main?'</main>':'').'</body></html>';
        return Rodeio_Menu_Pdf::apply($html);
    }
    public static function ajax()
    {
        $id=absint($_GET['post_id']??0);
        if(!current_user_can('edit_post',$id) || !current_user_can('manage_options'))wp_send_json_error(['message'=>'Acesso restrito.'],403);
        check_ajax_referer('rodeio-preview-'.$id);
        try{nocache_headers();wp_send_json_success(['html'=>self::document($id,sanitize_key($_GET['context']??'general'))]);}
        catch(Throwable $e){wp_send_json_error(['message'=>'Não foi possível carregar a prévia. Os campos continuam disponíveis.'],500);}
    }
}
add_action('wp_ajax_rodeio_editor_preview',['Rodeio_Editor_Preview','ajax']);
