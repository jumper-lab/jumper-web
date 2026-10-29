<?php
/** Human-sized content groups over the original ACF fields. No change to saved field names. */
class Rodeio_Editor_Form
{
    private static function text($node){return trim(preg_replace('/\s+/u',' ',implode(' ',array_map(static fn($n)=>trim($n->nodeValue),iterator_to_array((new DOMXPath($node->ownerDocument))->query('.//text()',$node))))));}
    private static function ancestor($node,$tags){for($p=$node instanceof DOMText?$node->parentNode:$node;$p;$p=$p->parentNode)if($p instanceof DOMElement && in_array($p->tagName,$tags,true))return $p;return null;}
    private static function block($node,$doc,$fallback)
    {
        $dialog=self::ancestor($node,['dialog']);
        if($dialog){$heading=$doc->xpath->query('.//h2',$dialog)->item(0);return [$dialog,$dialog->getAttribute('id')==='navigation-dialog'?'Menu do celular':($heading?self::text($heading):$fallback)];}
        $classes=['visit-heading'=>'Apresentação','visit-address'=>'Endereço','visit-hours'=>'Horários','visit-reservation'=>'Reservas','visit-orders'=>'Pedidos em casa','visit-gallery-section'=>'Fotos da unidade','hero'=>'Abertura da página','home-cuisine'=>'Apresentação do cardápio','home-houses'=>'Restaurantes','home-occasion'=>'Eventos','home-memory'=>'Nossa história','footer-signoff'=>'Marca e pedidos','footer-bottom'=>'Informações finais'];
        for($p=$node instanceof DOMText?$node->parentNode:$node;$p && $p!==$doc->root;$p=$p->parentNode){
            if(!($p instanceof DOMElement))continue;
            $names=preg_split('/\s+/',$p->getAttribute('class'));
            foreach($classes as $class=>$title)if(in_array($class,$names,true))return [$p,$title];
            if(in_array('footer-unit',$names,true)||in_array('footer-contact',$names,true)||in_array('house-row',$names,true)){$head=$doc->xpath->query('.//h2|.//h3',$p)->item(0);return [$p,$head?self::text($head):$fallback];}
            if($p->tagName==='nav')return [$p,$p->getAttribute('aria-label')?:'Links de navegação'];
            if($p->tagName==='header')return [$p,in_array('site-header',$names,true)?'Cabeçalho e marca':'Apresentação'];
            if($p->tagName==='article'){$head=$doc->xpath->query('.//h2|.//h3',$p)->item(0);if($head)return [$p,self::text($head)];}
            if($p->tagName==='footer')return [$p,'Marca e informações do rodapé'];
            if($p->tagName==='section'){$head=$doc->xpath->query('.//h1|.//h2',$p)->item(0);return [$p,$head?self::text($head):$fallback];}
        }
        return [$doc->root,$fallback==='Conteúdo principal'?'Conteúdo da página':$fallback];
    }
    public static function describe($doc,$snapshot,$rows)
    {
        $blocks=[];$seen=[];
        foreach($snapshot['data'] as $kind=>$items)foreach($items as $index=>$item){
            $meta=$rows[$kind][$index];$node=$doc->node(explode('@',$item['key'])[0]);if(!$node)throw new RuntimeException('Campo sem referência.');
            $anchor=self::ancestor($node,['a']);
            if($kind==='images'||$kind==='menus')$group=$node;
            elseif($anchor)$group=$anchor;
            elseif($node instanceof DOMText)$group=self::ancestor($node,['h1','h2','h3','h4','p','figcaption','label','address','li','dt','dd'])?:$node->parentNode;
            else $group=$node;
            [$block,$title]=self::block($group,$doc,$meta['section']);$key=$block->getNodePath();
            if(!isset($blocks[$key])){$unique=$title;$i=1;while(in_array($unique,array_column($blocks,'title'),true))$unique=$title.' · '.(++$i);$blocks[$key]=['key'=>$key,'title'=>$unique,'groups'=>[]];}
            $group_key=$group->getNodePath();$tag=$group instanceof DOMElement?$group->tagName:'';
            if(!isset($blocks[$key]['groups'][$group_key])){
                $summary=self::text($group);$type=$kind==='images'?'image':($kind==='menus'?'menu':($anchor?'link':'text'));
                $names=['h1'=>'Título da página','h2'=>'Título da seção','h3'=>'Subtítulo','p'=>'Descrição','figcaption'=>'Legenda da imagem','label'=>'Campo do formulário','address'=>'Endereço','li'=>'Horário ou informação'];
                $label=$type==='link'?'Botão ou link':($type==='image'?$item['context']:($type==='menu'?'Links do menu':($names[$tag]??$meta['label'])));
                if($type==='text' && $tag==='label' && $summary!=='')$label='Campo · '.mb_substr($summary,0,80);
                if($type==='link')$label=$summary!==''?'Botão · '.mb_substr($summary,0,80):($doc->xpath->query('.//img|.//picture',$group)->length?'Destino da imagem':'Destino do link');
                $blocks[$key]['groups'][$group_key]=['key'=>$group_key,'type'=>$type,'label'=>$label,'summary'=>mb_substr($summary,0,250),'parts'=>[],'restaurantName'=>$tag==='h1' && strpos($group->getAttribute('class'),'restaurant-name')!==false];
            }
            $emphasis=false;for($p=$node->parentNode;$p && $p!==$group;$p=$p->parentNode)if($p instanceof DOMElement && in_array($p->tagName,['em','i','strong','b'],true))$emphasis=true;
            $part=array_merge($meta,['kind'=>$kind,'index'=>$index,'emphasis'=>$emphasis]);
            foreach(['value','url','alt','pick','mobile','kind'] as $property)if(isset($item[$property]))$part[$property==='kind'?'imageKind':$property]=$item[$property];
            $blocks[$key]['groups'][$group_key]['parts'][]=$part;
            $seen[]=$kind.':'.$index;
        }
        foreach($blocks as &$block){$block['groups']=array_values($block['groups']);foreach($block['groups'] as &$group){$text_parts=array_values(array_filter($group['parts'],static fn($p)=>$p['kind']==='texts'));
            if($block['title']==='Horários' && $group['label']==='Horário ou informação' && $text_parts)$group['label']='Período · '.$text_parts[0]['value'];
            if($group['restaurantName'])$group['label']='Nome do restaurante';
            foreach($group['parts'] as &$part){
                if($part['kind']==='texts'){
                    if($group['restaurantName'])$part['fieldLabel']=$part['index']===$text_parts[0]['index']?'Marca':'Nome da unidade';
                    elseif($block['title']==='Horários' && count($text_parts)>1)$part['fieldLabel']=$part['index']===$text_parts[0]['index']?'Dia ou período':'Horário de funcionamento';
                    elseif($group['type']==='link')$part['fieldLabel']=count($text_parts)===1?'Texto do botão ou link':($part['index']===$text_parts[0]['index']?'Nome do botão':'Complemento do botão');
                    elseif(count($text_parts)>1)$part['fieldLabel']=$part['emphasis']?'Trecho em destaque':'Trecho '.(array_search($part['index'],array_column($text_parts,'index'),true)+1);
                    else $part['fieldLabel']=$group['label'];
                }elseif($part['kind']==='links')$part['fieldLabel']='Para onde este botão leva';
            }unset($part);
        }unset($group);}unset($block);
        if(count(array_unique($seen))!==array_sum(array_map('count',$snapshot['data'])))throw new RuntimeException('Mapeamento incompleto.');
        return array_values($blocks);
    }
}
