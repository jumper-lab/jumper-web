<?php
/** Task-oriented entry point for the existing shared content records. */
class Rodeio_Editor_Dashboard
{
    public static function areas()
    {
        $ids=get_option('_rde_fragment_ids',[]);
        return [
            'settings'=>['title'=>'Dados e contatos','description'=>'Telefone, WhatsApp, iFood, Instagram e endereços das unidades.','scope'=>'Atualiza as ocorrências compartilhadas no site','icon'=>'phone','id'=>(int)($ids['settings']??0)],
            'header'=>['title'=>'Logo e navegação','description'=>'Logo do cabeçalho, links do menu e navegação do celular.','scope'=>'Cabeçalho e menu mobile','icon'=>'menu','id'=>(int)($ids['header']??0)],
            'footer'=>['title'=>'Rodapé e pedidos','description'=>'Logo do rodapé, títulos, ícones de pedido e botão Fale com a gente.','scope'=>'Final de todas as páginas','icon'=>'align-left','id'=>(int)($ids['footer']??0)],
            'dialogs'=>['title'=>'Janelas e formulários','description'=>'Textos das janelas de contato, delivery, cardápio e escolha de canal.','scope'=>'Conteúdo que abre sobre a página','icon'=>'feedback','id'=>(int)($ids['dialogs']??0)],
        ];
    }
    public static function menu()
    {
        add_menu_page('Ajustes do site Rodeio','Rodeio · Ajustes','manage_options','rodeio-site',[self::class,'render'],'dashicons-admin-customizer',26);
        add_submenu_page('rodeio-site','Visão geral','Visão geral','manage_options','rodeio-site',[self::class,'render']);
        foreach(self::areas() as $key=>$area){
            $hook=add_submenu_page('rodeio-site',$area['title'],$area['title'],'manage_options','rodeio-edit-'.$key,'__return_null');
            add_action('load-'.$hook,static function()use($area){if(!current_user_can('manage_options'))wp_die('Acesso restrito.');wp_safe_redirect(get_edit_post_link($area['id'],'raw'));exit;});
        }
    }
    public static function render()
    {
        if(!current_user_can('manage_options'))return;
        echo '<div class="wrap rde-dashboard"><div class="rde-dashboard-head"><p class="rde-eyebrow">RODEIO · GESTÃO DO SITE</p><h1>O que você quer atualizar?</h1><p>Escolha uma área. Cada opção mostra o que será alterado e onde isso aparece no site.</p><a class="button" target="_blank" rel="noopener noreferrer" href="'.esc_url(home_url('/')).'">Ver site ↗</a></div>';
        echo '<section class="rde-dashboard-section" aria-labelledby="rde-shared-title"><h2 id="rde-shared-title">Informações e áreas compartilhadas</h2><p>Dados e contatos centraliza informações repetidas. As outras opções cuidam da apresentação de cada área.</p><div class="rde-dashboard-cards">';
        foreach(self::areas() as $area){if(!$area['id'])continue;echo '<a class="rde-dashboard-card" href="'.esc_url(get_edit_post_link($area['id'],'raw')).'"><span class="dashicons dashicons-'.esc_attr($area['icon']).'" aria-hidden="true"></span><h3>'.esc_html($area['title']).'</h3><p>'.esc_html($area['description']).'</p><span class="rde-card-scope">'.esc_html($area['scope']).'</span><strong>Editar esta área →</strong></a>';}
        echo '</div></section><section class="rde-dashboard-section" aria-labelledby="rde-pages-title"><h2 id="rde-pages-title">Conteúdo das páginas</h2><p>Títulos, textos, fotos e horários pertencem à página em que aparecem.</p><div class="rde-page-links">';
        $utility=[];
        foreach(get_posts(['post_type'=>'page','post_status'=>'publish','numberposts'=>-1,'meta_key'=>'_rodeio_managed_route','orderby'=>'menu_order title','order'=>'ASC']) as $page){if(in_array($page->ID,[804,806,820,821],true)){$utility[]=$page;continue;}echo '<a href="'.esc_url(get_edit_post_link($page->ID,'raw')).'">'.esc_html($page->post_title).'<span aria-hidden="true">↗</span></a>';}
        echo '</div><details class="rde-page-support"><summary>Páginas de apoio</summary><p>Telas completas do cardápio, reservas e formulário de eventos.</p><div class="rde-page-links">';foreach($utility as $page)echo '<a href="'.esc_url(get_edit_post_link($page->ID,'raw')).'">'.esc_html($page->post_title).'</a>';echo '</div></details></section>';
        echo '<section class="rde-dashboard-section rde-form-recipients" aria-labelledby="rde-forms-title"><h2 id="rde-forms-title">Recebimento dos formulários</h2><p>Os visitantes enviam mensagens pelos formulários. Estes são os destinatários internos; não são links de contato públicos.</p><dl>';
        foreach([363=>'SAC · Jardins',318=>'SAC · Iguatemi',393=>'Compliance',364=>'Eventos'] as $id=>$label){$meta=get_post_meta($id,'forminator_form_meta',true);$emails=[];foreach($meta['notifications']??[] as $notice){foreach(explode(',',$notice['recipients']??'') as $email)if(is_email(trim($email)))$emails[]=trim($email);}echo '<div><dt>'.esc_html($label).'</dt><dd>'.esc_html(implode(' · ',array_unique($emails))).'</dd></div>';}
        echo '</dl><p class="rde-form-note">Para mudar regras de envio ou destinatários, use o Forminator. Editar o texto de uma janela não muda quem recebe as mensagens.</p></section></div>';
    }
    public static function enqueue($hook)
    {
        if(strpos($hook,'rodeio-site')!==false)wp_enqueue_style('rodeio-settings-dashboard',get_template_directory_uri().'/editor-ui.css',[],filemtime(__DIR__.'/editor-ui.css'));
    }
    public static function legacy_list()
    {
        if(($_GET['post_type']??'')==='rodeio_layout' && empty($_REQUEST['action']) && current_user_can('manage_options')){wp_safe_redirect(admin_url('admin.php?page=rodeio-site'));exit;}
    }
    public static function shared_header($post)
    {
        if(!$post || $post->post_type!=='rodeio_layout')return;
        foreach(self::areas() as $area){if($area['id']!==$post->ID)continue;echo '<div class="rde-shared-heading"><a href="'.esc_url(admin_url('admin.php?page=rodeio-site')).'">← Voltar aos ajustes do site</a><h2>'.esc_html($area['title']).'</h2><p>'.esc_html($area['description']).'</p><p class="rde-shared-scope">'.esc_html($area['scope']).'. Clique em Atualizar para salvar.</p></div>';break;}
    }
    public static function parent($parent)
    {
        if(get_current_screen() && get_current_screen()->post_type==='rodeio_layout')return 'rodeio-site';return $parent;
    }
    public static function submenu($submenu)
    {
        $id=(int)($_GET['post']??0);foreach(self::areas() as $key=>$area)if($area['id']===$id)return 'rodeio-edit-'.$key;return $submenu;
    }
}
add_action('admin_menu',['Rodeio_Editor_Dashboard','menu'],30);
add_action('admin_enqueue_scripts',['Rodeio_Editor_Dashboard','enqueue']);
add_action('load-edit.php',['Rodeio_Editor_Dashboard','legacy_list']);
add_action('edit_form_after_title',['Rodeio_Editor_Dashboard','shared_header'],1);
add_filter('parent_file',['Rodeio_Editor_Dashboard','parent']);
add_filter('submenu_file',['Rodeio_Editor_Dashboard','submenu']);

add_action('add_meta_boxes_rodeio_layout',static function(){
    global $wp_meta_boxes;
    foreach($wp_meta_boxes['rodeio_layout']['side']??[] as $priority=>$boxes) if(isset($boxes['submitdiv']))$wp_meta_boxes['rodeio_layout']['side'][$priority]['submitdiv']['title']='Salvar alterações';
});
