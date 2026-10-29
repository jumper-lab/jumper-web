<?php
/** Read-only contract for the grouped editor. Run in the WordPress runtime. */
function rodeio_editor_form_contract()
{
    $total=0;$records=0;$paired=0;
    foreach(Rodeio_Editor::all_ids() as $id){
        $snapshot=Rodeio_Editor::snapshot($id);$description=Rodeio_Editor_UI::describe($id);$seen=[];
        foreach($description['blocks'] as $block)foreach($block['groups'] as $group){
            $kinds=array_column($group['parts'],'kind');
            if(in_array('texts',$kinds,true)&&in_array('links',$kinds,true))$paired++;
            foreach($group['parts'] as $part){
                $key=$part['kind'].':'.$part['index'];
                if(isset($seen[$key]))throw new Exception('Repeated control '.$id.' '.$key);
                $seen[$key]=true;$total++;
                $original=$snapshot['data'][$part['kind']][$part['index']];
                foreach(['value','url','alt'] as $property)if(isset($original[$property])&&$part[$property]!==$original[$property])throw new Exception('Changed source value '.$id.' '.$key);
                if($part['kind']==='texts'&&empty($part['fieldLabel']))throw new Exception('Missing human label '.$id.' '.$key);
            }
            if($group['restaurantName']&&array_column($group['parts'],'fieldLabel')!==['Marca','Nome da unidade'])throw new Exception('Restaurant name not grouped '.$id);
            if(strpos($group['label'],'Período · ')===0&&array_column($group['parts'],'fieldLabel')!==['Dia ou período','Horário de funcionamento'])throw new Exception('Hours not grouped '.$id);
        }
        if(count($seen)!==array_sum(array_map('count',$snapshot['data'])))throw new Exception('Incomplete mapping '.$id);
        if(hash('sha256',get_post_field('post_content',$id,'raw'))!==$snapshot['token'])throw new Exception('Audit wrote content '.$id);
        $records++;
    }
    if(!$paired)throw new Exception('No grouped button text/destination');
    return ['records'=>$records,'mapped_fields'=>$total,'buttons_with_text_and_destination'=>$paired,'writes'=>0];
}
