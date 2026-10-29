<?php
/** Named ACF controls over the existing shared HTML data; no parallel source of truth. */
class Rodeio_Editor_Data
{
    public static function id() { return (int) (get_option('_rde_fragment_ids', [])['settings'] ?? 0); }
    public static function schema()
    {
        return [
            'phone_display'=>['Telefone de atendimento','text','general'],
            'instagram'=>['Instagram','url','general'],
            'whatsapp'=>['WhatsApp do delivery','text','orders'],
            'ifood'=>['Link do iFood','url','orders'],
            'address_jardins'=>['Rua e número','text','jardins'],
            'district_jardins'=>['Bairro, cidade e estado','text','jardins'],
            'map_jardins'=>['Link do mapa','url','jardins'],
            'tagme_jardins'=>['Link do sistema de reservas','url','jardins'],
            'address_iguatemi'=>['Rua e número','text','iguatemi'],
            'district_iguatemi'=>['Bairro, cidade e estado','text','iguatemi'],
            'map_iguatemi'=>['Link do mapa','url','iguatemi'],
            'tagme_iguatemi'=>['Link do sistema de reservas','url','iguatemi'],
        ];
    }
    private static function field($key,$label,$type,$extra=[])
    {
        return array_merge(['key'=>'field_rde_site_'.$key,'name'=>'rde_site_'.$key,'label'=>$label,'type'=>$type],$extra);
    }
    public static function fields()
    {
        if(!function_exists('acf_add_local_field_group') || !self::id()) return;
        $fields=[self::field('base','Versão','text',['readonly'=>1,'wrapper'=>['class'=>'rde-binding']])];
        foreach(['general'=>'Contatos e pedidos','jardins'=>'Rodeio Jardins','iguatemi'=>'Rodeio Iguatemi'] as $tab=>$title){
            $fields[]=self::field('tab_'.$tab,$title,'tab');
            foreach(self::schema() as $key=>$def){
                if(($tab==='general' && !in_array($def[2],['general','orders'],true)) || ($tab!=='general' && $def[2]!==$tab)) continue;
                if(strpos($key,'map_')===0) $fields[]=self::field('advanced_'.$tab,'Links de mapa e reservas','accordion',['open'=>0,'multi_expand'=>0]);
                $extra=['required'=>1,'wrapper'=>['width'=>strpos($key,'map_')===0||strpos($key,'tagme_')===0?'100':'50']];
                if($key==='phone_display')$extra['instructions']='Número exibido no site. O botão de ligação é atualizado junto.';
                elseif($key==='whatsapp')$extra['instructions']='Número com DDD. Exemplo: (11) 97592-4615. Não é preciso montar um link.';
                elseif($key==='ifood')$extra['instructions']='Endereço da loja no iFood. Atualiza os atalhos que usam esse canal.';
                elseif($def[1]==='url')$extra['instructions']='Cole o endereço completo, começando com https://.';
                $fields[]=self::field($key,$def[0],$def[1],$extra);
            }
            if($tab!=='general'){
                $fields[]=self::field('advanced_end_'.$tab,'','accordion',['endpoint'=>1]);
                $page=$tab==='jardins'?823:824;
                $fields[]=self::field('hours_'.$tab,'Horários e fotos','message',['message'=>'Os horários, as fotos e os textos da unidade ficam na <a href="'.esc_url(get_edit_post_link($page,'raw')).'">página do restaurante</a>.','esc_html'=>0]);
            }
        }
        acf_add_local_field_group(['key'=>'group_rodeio_settings_v2','title'=>'Dados e contatos do site','fields'=>$fields,'location'=>[[['param'=>'post','operator'=>'==','value'=>(string)self::id()]]],'position'=>'acf_after_title','style'=>'default','active'=>true,'show_in_rest'=>false]);
    }
    public static function load($value,$id,$field,$fixture_id=null)
    {
        $target=$fixture_id===null?self::id():(int)$fixture_id;
        if((int)$id!==$target)return $value;
        $key=substr($field['key'],strlen('field_rde_site_'));
        if($key==='base')return Rodeio_Editor::snapshot($id)['token'];
        $facts=Rodeio_Editor::settings($target);$value=$facts[$key]['value']??'';
        if($key==='whatsapp'){
            $digits=preg_replace('/\D/','',$value);
            if(preg_match('/^55(\d{2})(\d{4,5})(\d{4})$/',$digits,$m))return '+55 ('.$m[1].') '.$m[2].'-'.$m[3];
        }
        return $value;
    }
    public static function normalized($key,$value)
    {
        if(!is_string($value))throw new RuntimeException('Confira o formato do campo.');
        $value=trim($value);if($value==='' || mb_strlen($value)>2048)throw new RuntimeException('Preencha os dados antes de salvar.');
        if($key==='whatsapp'){
            if(!preg_match('/^[+()\d\s.-]+$/',$value))throw new RuntimeException('Informe o número do WhatsApp com DDD.');
            $digits=preg_replace('/\D/','',$value);if(strlen($digits)===10||strlen($digits)===11)$digits='55'.$digits;
            if(!preg_match('/^55\d{10,11}$/',$digits))throw new RuntimeException('Confira o número do WhatsApp com DDD.');
            return 'https://wa.me/'.$digits;
        }
        if($key==='phone_display'){
            $digits=preg_replace('/\D/','',$value);
            if(!preg_match('/^[+()\d\s.-]{10,30}$/',$value) || !(strlen($digits)===10 || strlen($digits)===11 || preg_match('/^55\d{10,11}$/',$digits)))throw new RuntimeException('Confira o telefone de atendimento com DDD.');
        }
        if((self::schema()[$key][1]??'')==='url' && !preg_match('~^https?://~i',$value))throw new RuntimeException('Use um endereço completo começando com https://.');
        return (self::schema()[$key][1]??'')==='url'?Rodeio_Editor_Document::url($value,'href'):$value;
    }
    public static function convert_payload($id,$raw,$fixture_id=null)
    {
        if((int)$id!==($fixture_id===null?self::id():(int)$fixture_id))throw new RuntimeException('Área de dados inválida.');
        $s=Rodeio_Editor::snapshot($id);
        if(!isset($raw['field_rde_site_base']) || !is_string($raw['field_rde_site_base']) || !hash_equals($s['token'],$raw['field_rde_site_base']))throw new RuntimeException('Os dados mudaram em outra edição. Recarregue esta tela antes de salvar.');
        $doc=new Rodeio_Editor_Document(Rodeio_Editor::fragment($s['content']));$desired=$s['data'];
        foreach(self::schema() as $key=>$def){
            $field='field_rde_site_'.$key;if(!array_key_exists($field,$raw))continue;
            $value=self::normalized($key,$raw[$field]);$found=false;
            foreach($doc->xpath->query('.//*[@data-rde-setting]',$doc->root) as $node){
                if($node->getAttribute('data-rde-setting')!==$key)continue;
                if($node->tagName==='a'){$kind='links';$path=$node->getNodePath().'@href';$prop='url';}
                else{$nodes=$doc->xpath->query('.//text()[normalize-space()]',$node);if($nodes->length!==1)throw new RuntimeException('Este dado precisa de revisão técnica: '.$def[0]);$kind='texts';$path=$nodes->item(0)->getNodePath();$prop='value';}
                foreach($desired[$kind] as &$row){if($row['key']===$path){$row[$prop]=$value;$found=true;break;}}unset($row);
            }
            if(!$found)throw new RuntimeException('Não foi possível localizar: '.$def[0]);
        }
        return Rodeio_Editor::encode($desired,$s['token']);
    }
    public static function translate($id=null)
    {
        $id=(int)($id??($_POST['_acf_post_id']??($_POST['post_ID']??0)));
        if($id!==self::id() || !current_user_can('manage_options') || Rodeio_Editor::$busy)return;
        if(isset($_POST['acf']['field_rde_base']) && !isset($_POST['acf']['field_rde_site_base'])) {
            $message='Esta tela de dados foi atualizada. Recarregue a página antes de salvar.';$_POST['acf']=[];acf_add_validation_error('',$message);set_transient('rde_editor_error_'.get_current_user_id(),$message,120);return;
        }
        if(!isset($_POST['acf']['field_rde_site_base']))return;
        try{$_POST['acf']=wp_slash(self::convert_payload($id,wp_unslash($_POST['acf'])));}
        catch(Throwable $e){$_POST['acf']=[];acf_add_validation_error('',$e->getMessage());set_transient('rde_editor_error_'.get_current_user_id(),$e->getMessage(),120);}
    }
    public static function editor_support()
    {
        if((int)($_GET['post']??0)===self::id())remove_post_type_support('rodeio_layout','editor');
    }
}
add_action('acf/init',['Rodeio_Editor_Data','fields'],15);
add_action('acf/validate_save_post',['Rodeio_Editor_Data','translate'],1);
add_action('acf/save_post',['Rodeio_Editor_Data','translate'],0);
add_action('load-post.php',['Rodeio_Editor_Data','editor_support']);
foreach(array_merge(['base'],array_keys(Rodeio_Editor_Data::schema())) as $key)add_filter('acf/load_value/key=field_rde_site_'.$key,['Rodeio_Editor_Data','load'],10,3);

add_filter('wp_insert_post_data',static function($data,$postarr){
    $id=(int)($postarr['ID']??0);
    if($id===Rodeio_Editor_Data::id() && !Rodeio_Editor::$busy && isset($_POST['acf']['field_rde_base']) && !isset($_POST['acf']['field_rde_site_base'])) {
        $data['post_content']=wp_slash(get_post_field('post_content',$id,'raw'));
    }
    return $data;
},99,2);
