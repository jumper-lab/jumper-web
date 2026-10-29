<?php
/** Detached rendering contract: no publication, files, options or public posts are changed. */
function rodeio_menu_pdf_contract()
{
    $pages=[];for($n=1;$n<=3;$n++)$pages[]=['url'=>'https://example.invalid/cardapio-paginas/pagina-'.$n.'.webp','width'=>1555,'height'=>2200];
    $bundle=['pdf_url'=>'https://example.invalid/cardapio-rodeio.pdf','pages'=>$pages];$checked=0;
    foreach(Rodeio_Editor::all_ids() as $id){
        $source=get_post_field('post_content',$id,'raw');
        if(Rodeio_Menu_Pdf::apply($source,[])!==$source)throw new Exception('Inactive bundle changed source '.$id);
        $out=Rodeio_Menu_Pdf::apply($source,$bundle);
        foreach(['form','script','style'] as $tag){preg_match_all('~<'.$tag.'\b.*?</'.$tag.'>~s',$source,$a);preg_match_all('~<'.$tag.'\b.*?</'.$tag.'>~s',$out,$b);if($a[0]!==$b[0])throw new Exception('Unrelated markup changed '.$id.' '.$tag);}
        if(preg_match('~(?:href|src|data-menu-url)="[^"]*/releases/[^"]*(?:cardapio-rodeio.pdf|cardapio-paginas/)~',$out))throw new Exception('Old menu assets left '.$id);
        if($id===804 && (substr_count($out,'data-pdf-page')!==3 || strpos($out,'de 3 do cardápio')===false))throw new Exception('Full page did not adapt to page count');
        if($source!==get_post_field('post_content',$id,'raw'))throw new Exception('Saved content changed '.$id);
        $checked++;
    }
    return ['native_and_shared_documents'=>$checked,'variable_page_count'=>true,'unrelated_markup_preserved'=>true,'writes'=>0];
}
