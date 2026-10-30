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
    if(!$doc->xpath->query('.//a[contains(concat(" ",@class," ")," header-delivery-shortcut ")]',$right)->length)$right->insertBefore($link('/rodeio-em-casa/','Delivery','header-delivery-shortcut'),$right->firstChild);
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
        $a=$link($whatsapp,'','delivery-whatsapp-float');$a->setAttribute('target','_blank');$a->setAttribute('rel','noopener noreferrer');$a->setAttribute('aria-label','Pedir delivery pelo WhatsApp (abre em outra aba)');
        $fragment=$doc->dom->createDocumentFragment();$fragment->appendXML('<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.75 11.5a8.75 8.75 0 0 1-13.1 7.58L3 20.5l1.37-4.48A8.75 8.75 0 1 1 20.75 11.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.3 6.9c.2-.1.6-.1.8.3l1 2.1c.1.3.1.5-.1.7l-.7.8c.7 1.3 1.7 2.3 3 3l.8-.9c.2-.2.4-.3.7-.1l2.1 1c.3.2.4.4.3.8-.2 1-1 1.7-2.1 1.7-2.7-.2-7.1-4-7.5-7.1-.1-1 .5-2 1.7-2.3Z" fill="currentColor"/></svg>');$a->appendChild($fragment);
        $copy=$doc->dom->createElement('span');$copy->appendChild($doc->dom->createElement('strong','Delivery'));$copy->appendChild($doc->dom->createElement('small','Peça pelo WhatsApp'));$a->appendChild($copy);$header->appendChild($a);
    }
    return $doc->html();
}
