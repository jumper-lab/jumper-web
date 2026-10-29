<?php
/** Versioned PDF + raster pages. One option switch publishes the entire prepared bundle. */
class Rodeio_Menu_Pdf
{
    const ACTIVE='_rodeio_menu_pdf_active';
    const JOB='_rodeio_menu_pdf_job';
    const LOCK='_rodeio_menu_pdf_lock';
    const MAX_BYTES=20971520;
    const MAX_PAGES=30;
    public static function active(){ $value=get_option(self::ACTIVE,[]);return is_array($value)?$value:[]; }
    public static function legacy()
    {
        $doc=new Rodeio_Editor_Document(Rodeio_Editor::fragment(get_post_field('post_content',804,'raw')));$pages=[];$url='';
        foreach($doc->xpath->query('.//a[@download]',$doc->root) as $a)if(strpos($a->getAttribute('href'),'cardapio-rodeio.pdf')!==false)$url=$a->getAttribute('href');
        foreach($doc->xpath->query('.//img[contains(@src,"/cardapio-paginas/")]',$doc->root) as $img)$pages[]=['url'=>$img->getAttribute('src'),'width'=>(int)$img->getAttribute('width'),'height'=>(int)$img->getAttribute('height')];
        return $url && $pages ? ['filename'=>'cardapio-rodeio.pdf','pdf_url'=>$url,'pages'=>$pages,'legacy'=>true] : [];
    }
    public static function page_url(){return admin_url('admin.php?page=rodeio-cardapio-pdf');}
    public static function menu(){add_submenu_page('rodeio-site','PDF do cardápio','PDF do cardápio','manage_options','rodeio-cardapio-pdf',[self::class,'panel']);}
    public static function enqueue($hook)
    {
        if(strpos($hook,'rodeio-cardapio-pdf')===false)return;
        acf_enqueue_scripts();wp_enqueue_media();
        wp_enqueue_style('rodeio-menu-pdf',get_template_directory_uri().'/menu-pdf.css',[],filemtime(__DIR__.'/menu-pdf.css'));
        wp_enqueue_script('rodeio-menu-pdf',get_template_directory_uri().'/menu-pdf.js',['acf-input'],filemtime(__DIR__.'/menu-pdf.js'),true);
        wp_add_inline_script('rodeio-menu-pdf','window.rodeioMenuPdf='.wp_json_encode(['endpoint'=>admin_url('admin-ajax.php'),'nonce'=>wp_create_nonce('rodeio-menu-pdf')]).';','before');
    }
    public static function panel()
    {
        if(!current_user_can('manage_options'))return;
        $active=self::active()?:self::legacy();$job=get_option(self::JOB,[]);$running=in_array($job['status']??'',['processing','ready'],true);
        echo '<div class="wrap rde-pdf-panel"><a class="rde-pdf-back" href="'.esc_url(admin_url('admin.php?page=rodeio-site')).'">← Voltar aos ajustes</a><header><p>RODEIO · CARDÁPIO</p><h1>Um PDF. Todo o cardápio atualizado.</h1><p>Escolha o arquivo e publique. As imagens do lightbox e da tela completa são geradas automaticamente, junto do novo download.</p></header><div class="rde-pdf-grid"><section class="rde-pdf-upload"><h2>Substituir cardápio</h2><ol><li>Escolha ou envie o PDF pela Biblioteca de mídia.</li><li>Clique em Preparar e publicar.</li><li>Aguarde todas as páginas serem geradas.</li></ol>';
        acf_render_field_wrap(['key'=>'field_rde_menu_pdf','name'=>'rde_menu_pdf','label'=>'Novo PDF do cardápio','type'=>'file','return_format'=>'id','library'=>'all','mime_types'=>'pdf','max_size'=>20,'value'=>0,'instructions'=>'PDF de até 20 MB e 30 páginas. O arquivo atual permanece disponível até a nova versão estar pronta.']);
        echo '<button type="button" id="rde-pdf-start" class="button button-primary">Preparar e publicar novo cardápio</button>';
        if($running)echo '<button type="button" id="rde-pdf-resume" class="button" data-job="'.esc_attr($job['id']).'">Continuar processamento anterior</button>';
        echo '<noscript><p>Ative JavaScript para preparar o arquivo pelo painel.</p></noscript><div id="rde-pdf-progress" class="rde-pdf-progress" hidden><progress max="100" value="0"></progress><p role="status" aria-live="polite"></p></div><p id="rde-pdf-result" role="status" aria-live="polite"></p><p class="rde-pdf-hint">Se ocorrer uma falha, o cardápio publicado não é substituído. Arquivos e versões anteriores são preservados.</p></section><section class="rde-pdf-current"><h2>Cardápio publicado</h2>';
        if($active){echo '<p><strong>'.esc_html($active['filename']).'</strong></p><p>'.count($active['pages']).' páginas · '.(isset($active['published_at'])?'publicado em '.esc_html(wp_date('d/m/Y H:i',$active['published_at'])):'versão aprovada em uso').'</p><a href="'.esc_url($active['pdf_url']).'" target="_blank" rel="noopener">Conferir PDF ↗</a><div class="rde-pdf-thumbnails">';foreach($active['pages'] as $i=>$page)echo '<figure><img loading="lazy" src="'.esc_url($page['url']).'" alt="Página '.($i+1).' do cardápio"><figcaption>Página '.($i+1).'</figcaption></figure>';echo '</div>';}
        else echo '<p>A versão aprovada do site está em uso. A primeira substituição feita aqui passará a gerenciar o PDF e suas imagens em conjunto.</p>';
        echo '<p><a href="'.esc_url(home_url('/cardapio/completo/')).'" target="_blank" rel="noopener">Ver cardápio no site ↗</a></p></section></div></div>';
    }
    public static function build_job($attachment)
    {
        if(!class_exists('Imagick'))throw new RuntimeException('O conversor de PDF não está disponível. O cardápio atual foi mantido.');
        $attachment=absint($attachment);$file=get_attached_file($attachment);$uploads=wp_upload_dir();$root=realpath($uploads['basedir']);$real=$file?realpath($file):false;
        if(get_post_type($attachment)!=='attachment' || get_post_status($attachment)==='trash' || !$real || !$root || strpos($real,$root.DIRECTORY_SEPARATOR)!==0 || !is_readable($real) || get_post_mime_type($attachment)!=='application/pdf')throw new RuntimeException('Escolha um PDF válido da Biblioteca de mídia.');
        if(filesize($real)>self::MAX_BYTES || filesize($real)<8)throw new RuntimeException('O PDF deve ter até 20 MB.');
        $stream=fopen($real,'rb');$header=fread($stream,5);fclose($stream);if($header!=='%PDF-')throw new RuntimeException('O arquivo selecionado não é um PDF válido.');
        self::limits();$probe=new Imagick();
        try{$probe->pingImage($real);$count=$probe->getNumberImages();if($count<1 || $count>self::MAX_PAGES)throw new RuntimeException('Use um PDF com 1 a 30 páginas.');foreach($probe as $page)if($page->getImageWidth()>5000 || $page->getImageHeight()>5000)throw new RuntimeException('As dimensões deste PDF excedem o limite do conversor.');}
        catch(Throwable $e){throw new RuntimeException('Não foi possível ler este PDF. Confira se ele está íntegro, sem senha e com até 30 páginas.');}finally{$probe->clear();}
        $id=wp_generate_uuid4();$relative='/rodeio-cardapios/'.$id;$dir=$uploads['basedir'].$relative;
        if(!wp_mkdir_p($dir.'/cardapio-paginas') || !copy($real,$dir.'/cardapio-rodeio.pdf'))throw new RuntimeException('Não foi possível preparar os arquivos. A versão atual foi mantida.');
        $current=self::active();
        return ['id'=>$id,'attachment'=>$attachment,'filename'=>wp_basename($real),'sha256'=>hash_file('sha256',$dir.'/cardapio-rodeio.pdf'),'pdf_url'=>$uploads['baseurl'].$relative.'/cardapio-rodeio.pdf','count'=>$count,'next'=>0,'pages'=>[],'status'=>'processing','created_at'=>time(),'previous_version'=>$current['id']??''];
    }
    private static function limits()
    {
        if(!class_exists('Imagick'))return;
        Imagick::setResourceLimit(Imagick::RESOURCETYPE_MEMORY,64*1024*1024);Imagick::setResourceLimit(Imagick::RESOURCETYPE_MAP,128*1024*1024);Imagick::setResourceLimit(Imagick::RESOURCETYPE_DISK,256*1024*1024);Imagick::setResourceLimit(Imagick::RESOURCETYPE_THREAD,1);
    }
    private static function directory($job)
    {
        if(!preg_match('/^[a-f0-9-]{36}$/',$job['id']??''))throw new RuntimeException('Processamento inválido.');
        return wp_upload_dir()['basedir'].'/rodeio-cardapios/'.$job['id'];
    }
    public static function process_page($job)
    {
        $index=(int)$job['next'];if($index >= $job['count'])return $job;
        $dir=self::directory($job);self::limits();$image=new Imagick();
        try{$image->setResolution(180,180);$image->readImage($dir.'/cardapio-rodeio.pdf['.$index.']');$image->setImageBackgroundColor('white');$flat=$image->mergeImageLayers(Imagick::LAYERMETHOD_FLATTEN);$image->clear();$image=$flat;$image->thumbnailImage(2200,2200,true,false);$image->setImageFormat('webp');$image->setImageCompressionQuality(88);$image->stripImage();$name='/cardapio-paginas/pagina-'.($index+1).'.webp';if(!$image->writeImage($dir.$name) || !filesize($dir.$name))throw new RuntimeException('A imagem não foi gravada.');$job['pages'][]=['url'=>dirname($job['pdf_url']).$name,'width'=>$image->getImageWidth(),'height'=>$image->getImageHeight()];$job['next']=$index+1;$job['status']=$job['next']===$job['count']?'ready':'processing';return $job;}
        finally{$image->clear();}
    }
    public static function publish($job)
    {
        $lock=get_option(self::LOCK,[]);$current=self::active();
        if(($current['id']??'')===$job['id'])return $current;
        if(($lock['id']??'')!==$job['id'] || ($current['id']??'')!==$job['previous_version'])throw new RuntimeException('Há outra atualização em andamento. Recarregue o painel.');
        if($job['status']!=='ready' || count($job['pages'])!==$job['count'])throw new RuntimeException('A geração ainda não terminou.');
        $dir=self::directory($job);if(hash_file('sha256',$dir.'/cardapio-rodeio.pdf')!==$job['sha256'])throw new RuntimeException('O PDF foi modificado durante o processamento.');
        foreach($job['pages'] as $i=>$page){$size=getimagesize($dir.'/cardapio-paginas/pagina-'.($i+1).'.webp');if(!$size || $size[0]!==$page['width'] || $size[1]!==$page['height'])throw new RuntimeException('Não foi possível validar uma página do cardápio.');}
        $job['published_at']=time();$job['status']='published';
        $backup=dirname(ABSPATH).'/rodeio-release-backups/menu-pdf';if(!wp_mkdir_p($backup))throw new RuntimeException('Não foi possível preservar a versão anterior.');
        $record=$backup.'/'.$job['id'].'.json';$history=wp_json_encode(['previous'=>$current,'next'=>$job]);if(file_put_contents($record,$history)!==strlen($history))throw new RuntimeException('Não foi possível salvar o histórico.');chmod($record,0600);
        if(!update_option(self::ACTIVE,$job,false))throw new RuntimeException('Não foi possível publicar a nova versão.');
        if(function_exists('w3tc_flush_all')){try{w3tc_flush_all();}catch(Throwable $e){error_log('Rodeio PDF: cache flush pending.');}}return $job;
    }
    public static function ajax()
    {
        if(!current_user_can('manage_options') || !current_user_can('upload_files'))wp_send_json_error(['message'=>'Acesso restrito.'],403);
        check_ajax_referer('rodeio-menu-pdf','nonce');$action=sanitize_key($_POST['operation']??'');$job=[];
        try{
            if($action==='start'){
                $lock=get_option(self::LOCK,[]);if($lock && time()-($lock['time']??0)>1800)delete_option(self::LOCK);
                $ticket=wp_generate_uuid4();if(!add_option(self::LOCK,['id'=>$ticket,'time'=>time()],'','no'))throw new RuntimeException('Já existe um processamento. Continue a atualização anterior ou tente novamente mais tarde.');
                try{$job=self::build_job(absint($_POST['attachment']??0));update_option(self::LOCK,['id'=>$job['id'],'time'=>time()],false);update_option(self::JOB,$job,false);}catch(Throwable $e){delete_option(self::LOCK);throw $e;}
            }elseif($action==='step'){
                $job=get_option(self::JOB,[]);if(!$job || !hash_equals($job['id'],(string)($_POST['job']??'')))throw new RuntimeException('Processamento não encontrado. Recarregue o painel.');
                if($job['status']==='published'){wp_send_json_success(self::status($job));return;}
                $lock=get_option(self::LOCK,[]);if(($lock['id']??'')!==$job['id'])throw new RuntimeException('Este processamento expirou. Selecione o PDF novamente.');
                // Parallel tabs cannot render the same step or race the final publication.
                $mutex='rde_pdf_step_'.$job['id'];$previous_step=get_option($mutex,0);if($previous_step && time()-(int)$previous_step>120)delete_option($mutex);if(!add_option($mutex,time(),'','no'))throw new RuntimeException('Aguarde a outra aba concluir esta página.');
                try{$job=self::process_page($job);update_option(self::JOB,$job,false);update_option(self::LOCK,['id'=>$job['id'],'time'=>time()],false);if($job['status']==='ready'){$job=self::publish($job);update_option(self::JOB,$job,false);delete_option(self::LOCK);}}catch(Throwable $e){$job['status']='failed';update_option(self::JOB,$job,false);delete_option(self::LOCK);throw $e;}finally{delete_option($mutex);}
            }else throw new RuntimeException('Operação inválida.');
            wp_send_json_success(self::status($job));
        }catch(Throwable $e){wp_send_json_error(['message'=>$e->getMessage()],400);}
    }
    public static function status($job){return ['id'=>$job['id'],'status'=>$job['status'],'done'=>$job['next'],'total'=>$job['count'],'url'=>home_url('/cardapio/completo/')];}
    public static function apply($html,$bundle=null)
    {
        $bundle=$bundle??self::active();if(empty($bundle['pages']) || empty($bundle['pdf_url']))return $html;
        $doc=new Rodeio_Editor_Document($html);$changed=false;
        foreach($doc->xpath->query('.//*[@href or @data-menu-url or @data-menu-alias-url]',$doc->root) as $node)foreach(['href','data-menu-url','data-menu-alias-url'] as $attr){$value=$node->getAttribute($attr);$path=wp_parse_url($value,PHP_URL_PATH)?:'';if(preg_match('~/(?:cardapio-rodeio\.pdf)$~',$path)){$node->setAttribute($attr,$bundle['pdf_url']);$changed=true;}}
        foreach($doc->xpath->query('.//div[contains(concat(" ",normalize-space(@class)," ")," digital-menu-pdf-pages ") or contains(concat(" ",normalize-space(@class)," ")," workspace-pdf-pages ")]',$doc->root) as $container){while($container->firstChild)$container->removeChild($container->firstChild);foreach($bundle['pages'] as $index=>$page){$wrap=$doc->dom->createElement('div');$wrap->setAttribute('class','pdf-page-zoom');$wrap->setAttribute('data-pdf-page','');$img=$doc->dom->createElement('img');foreach(['src'=>$page['url'],'width'=>$page['width'],'height'=>$page['height'],'alt'=>'Página '.($index+1).' de '.count($bundle['pages']).' do cardápio Rodeio','loading'=>$index===0?'eager':'lazy','decoding'=>'async','draggable'=>'false'] as $attr=>$value)$img->setAttribute($attr,(string)$value);$wrap->appendChild($img);$container->appendChild($wrap);}$changed=true;}
        // Preserve the complete document byte structure outside the targeted PDF references/containers.
        if(!$changed)return $html;
        $out=$html;
        foreach(['digital-menu-pdf-pages','workspace-pdf-pages'] as $class){$nodes=$doc->xpath->query('.//div[contains(concat(" ",normalize-space(@class)," ")," '.$class.' ")]',$doc->root);foreach($nodes as $container){$replacement=$doc->dom->saveHTML($container);$out=preg_replace_callback('~<div\b[^>]*class="[^\"]*\b'.preg_quote($class,'~').'\b[^\"]*"[^>]*>(?:\s*<div\b[^>]*data-pdf-page[^>]*>\s*<img\b[^>]*>\s*</div>\s*)*</div>~s',static fn()=>$replacement,$out,1);}}
        $out=preg_replace_callback('~(href|data-menu-url|data-menu-alias-url)="([^\"]*\/cardapio-rodeio\.pdf(?:\?[^\"]*)?)"~',static fn($m)=>$m[1].'="'.esc_url($bundle['pdf_url']).'"',$out);
        return $out;
    }
}
add_action('admin_menu',['Rodeio_Menu_Pdf','menu'],35);
add_action('admin_enqueue_scripts',['Rodeio_Menu_Pdf','enqueue']);
add_action('wp_ajax_rodeio_menu_pdf',['Rodeio_Menu_Pdf','ajax']);
add_action('edit_form_after_title',static function($post){if(in_array((int)$post->ID,[802,804,899],true))echo '<p class="notice notice-info" style="padding:14px">Para substituir o PDF e gerar todas as páginas do lightbox, use <a href="'.esc_url(Rodeio_Menu_Pdf::page_url()).'">PDF do cardápio</a>.</p>';});
