<?php
/** Read-only preview audit. No pages, settings, messages or mail are written. */
function rodeio_editor_devices_contract($renderer='Rodeio_Editor_Preview')
{
    $documents=0;$bindings=0;$data_keys=[];
    foreach(Rodeio_Editor::all_ids() as $id){
        $before=hash('sha256',get_post_field('post_content',$id,'raw'));
        foreach($id===Rodeio_Editor_Data::id()?['general','jardins','iguatemi']:['general'] as $context){
            $html=$renderer::document($id,$context);$doc=new Rodeio_Editor_Document($html);
            if($doc->xpath->query('//script|//iframe|//object|//embed|//base|//a[@href]|//form[@action]')->length)throw new Exception('Active preview content '.$id);
            foreach($doc->xpath->query('//*') as $node)foreach($node->attributes as $attribute)if(stripos($attribute->name,'on')===0)throw new Exception('Executable attribute '.$id);
            if(strpos(html_entity_decode($html,ENT_QUOTES,'UTF-8'),"script-src 'none'")===false)throw new Exception('Missing preview policy '.$id);
            if($id===Rodeio_Editor_Data::id())foreach($doc->xpath->query('//*[@data-rde-setting-preview]') as $node)$data_keys[$node->getAttribute('data-rde-setting-preview')]=true;
            else foreach(Rodeio_Editor::snapshot($id)['data'] as $kind=>$items)foreach($items as $index=>$item){$key=$kind.':'.$index;if(!$doc->xpath->query('//*[contains(concat(" ",@data-rde-preview," ")," '.$key.' ")]')->length)throw new Exception('Missing preview target '.$id.' '.$key);$bindings++;}
            $documents++;
        }
        if(hash('sha256',get_post_field('post_content',$id,'raw'))!==$before)throw new Exception('Preview changed content '.$id);
    }
    if(array_diff(array_keys(Rodeio_Editor_Data::schema()),array_keys($data_keys)))throw new Exception('Missing shared data target');
    return ['documents'=>$documents,'content_targets'=>$bindings,'named_data_fields'=>count($data_keys),'writes'=>0];
}
