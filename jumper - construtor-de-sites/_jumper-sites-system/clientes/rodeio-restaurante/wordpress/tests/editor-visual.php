<?php
/** Read-only WordPress audit. Edits happen only in detached DOM documents. */
function rodeio_editor_visual_contract()
{
    $counts=['texts'=>0,'images'=>0,'links'=>0,'menus'=>0];$previews=0;
    foreach(Rodeio_Editor::all_ids() as $id){
        $snapshot=Rodeio_Editor::snapshot($id);$description=Rodeio_Editor_UI::describe($id);
        foreach($snapshot['data'] as $kind=>$items){
            if(count($items)!==count($description['rows'][$kind]??[]))throw new Exception('Unmapped field '.$id.' '.$kind);
            foreach($items as $index=>$item){
                $desired=$snapshot['data'];
                if($kind==='texts')$desired[$kind][$index]['value'].=' QA';
                elseif($kind==='images'){$desired[$kind][$index]['url']='https://example.invalid/image-qa.jpg';$desired[$kind][$index]['pick']=0;$desired[$kind][$index]['mobile']=0;$desired[$kind][$index]['alt']='QA image';}
                elseif($kind==='links')$desired[$kind][$index]['url']='https://example.invalid/link-qa';
                else{$desired[$kind][$index]['items'][0]['label']='QA menu';$desired[$kind][$index]['items'][0]['url']='https://example.invalid/menu-qa';}
                $doc=new Rodeio_Editor_Document(Rodeio_Editor::fragment($snapshot['content']));
                $captured=(new Rodeio_Editor_Document($doc->merge($snapshot['data'],$desired)))->capture();$actual=null;
                foreach($captured[$kind] as $row)if($row['key']===$item['key'])$actual=$row;
                if(!$actual || Rodeio_Editor_Document::semantic($actual,$kind)!==Rodeio_Editor_Document::semantic($desired[$kind][$index],$kind))throw new Exception('Reverse synchronization failed '.$id.' '.$kind.' '.$index);
                $counts[$kind]++;
            }
        }
        if($id!==Rodeio_Editor_Data::id()){
            $preview=Rodeio_Editor_Preview::document($id);$doc=new Rodeio_Editor_Document($preview);
            if($doc->xpath->query('.//script|.//iframe|.//object|.//embed',$doc->root)->length)throw new Exception('Executable preview '.$id);
            if(strpos($preview,"script-src 'none'")===false && strpos($preview,'script-src &#039;none&#039;')===false)throw new Exception('Missing preview CSP '.$id);
            $previews++;
        }
        if(hash('sha256',get_post_field('post_content',$id,'raw'))!==$snapshot['token'])throw new Exception('Audit changed saved content '.$id);
    }
    return ['fields'=>$counts,'script_free_previews'=>$previews,'writes'=>0];
}
