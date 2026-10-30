<?php
/** Build a reviewed header update from the current editable HTML. Does not save anything. */
function rodeio_delivery_emphasis_header($html, $whatsapp)
{
    if (!preg_match('~^https://wa\.me/[0-9]+$~', $whatsapp)) throw new RuntimeException('Invalid delivery destination');
    $doc = new Rodeio_Editor_Document($html);
    if($doc->xpath->query('.//header[@data-delivery-emphasis="1"]',$doc->root)->length)return $html;
    $one = static function ($query) use ($doc) { $node=$doc->xpath->query($query,$doc->root)->item(0); if(!$node)throw new RuntimeException('Missing header target');return $node; };
    $link = static function ($href,$label,$class='') use ($doc) { $a=$doc->dom->createElement('a');$a->setAttribute('href',$href);if($class)$a->setAttribute('class',$class);$a->appendChild($doc->dom->createTextNode($label));return $a; };
    $right=$one('.//div[contains(concat(" ",@class," ")," header-right ")]');
    $nav=$one('.//div[contains(concat(" ",@class," ")," header-right ")]/nav');
    $nav->setAttribute('aria-label','Restaurantes, eventos e serviços');
    if(!$doc->xpath->query('.//a[@href="/rodeio-em-casa/"]',$nav)->length)$nav->appendChild($link('/rodeio-em-casa/','Delivery','header-delivery-link'));
    if(!$doc->xpath->query('.//a[contains(@href,"#fale-com-a-gente")]',$nav)->length)$nav->appendChild($link('/sac/#fale-com-a-gente','Contato'));
    $primary=$one('.//nav[contains(concat(" ",@class," ")," menu-primary-nav ")]');
    foreach([['/rodeio-em-casa/','Delivery'],['/sac/#fale-com-a-gente','Contato']] as [$href,$label]){
        if($doc->xpath->query('.//a[@href="'.$href.'"]',$primary)->length)continue;
        $template=$one('.//nav[contains(concat(" ",@class," ")," menu-primary-nav ")]/a');$a=$template->cloneNode(true);$a->setAttribute('href',$href);$a->removeAttribute('aria-current');
        $span=$doc->xpath->query('.//span',$a)->item(0);$span->nodeValue=$label;
        if($label==='Delivery'){$event=$doc->xpath->query('.//a[@href="/eventos/"]',$primary)->item(0);if($event)$primary->insertBefore($a,$event->nextSibling);else $primary->appendChild($a);}else $primary->appendChild($a);
    }
    // The two primary entries now own delivery and the contact-channel chooser.
    foreach(iterator_to_array($doc->xpath->query('.//nav[contains(concat(" ",@class," ")," menu-service-nav ")] | .//p[contains(concat(" ",@class," ")," menu-signature ")]',$doc->root)) as $node)$node->parentNode->removeChild($node);
    $header=$one('.//header');$header->setAttribute('data-delivery-emphasis','1');
    if(!$doc->xpath->query('.//a[contains(concat(" ",@class," ")," delivery-whatsapp-float ")]',$header)->length){
        $a=$link('/rodeio-em-casa/','','delivery-whatsapp-float');$a->setAttribute('aria-haspopup','dialog');$a->setAttribute('aria-controls','rodeio-em-casa-dialog');
        $fragment=$doc->dom->createDocumentFragment();$fragment->appendXML('<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="5" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/><circle cx="19" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M5 18h8l-4-8H5m7 0h4l3 8M13 6h4l2 4M3 7h5v4H3V7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');$a->appendChild($fragment);
        $copy=$doc->dom->createElement('span');$copy->appendChild($doc->dom->createElement('strong','Peça na sua casa'));$a->appendChild($copy);$header->appendChild($a);
    }
    return $doc->html();
}
