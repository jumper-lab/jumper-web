<?php
/** ACF is a view over native HTML; saves use a three-way merge, not two competing copies. */
require_once __DIR__ . "/editor-dom.php";
require_once __DIR__ . "/editor-ui.php";
require_once __DIR__ . "/editor-form.php";
require_once __DIR__ . "/editor-preview.php";
require_once __DIR__ . "/menu-pdf.php";
require_once __DIR__ . "/editor-data.php";
require_once __DIR__ . "/editor-dashboard.php";
class Rodeio_Editor
{
    const VERSION = "1.0.0";
    public static $busy = false;
    private static $pending = [];
    private static $parts = [
        "texts" => ["key", "context", "value"],
        "images" => ["key", "context", "url", "pick", "mobile", "alt", "kind"],
        "links" => ["key", "context", "url"],
        "menus" => ["key", "context", "items"],
    ];
    public static function supported($id)
    {
        return is_numeric($id) &&
            !wp_is_post_revision($id) &&
            !wp_is_post_autosave($id) &&
            (get_post_type($id) === "rodeio_layout" ||
                (get_post_type($id) === "page" &&
                    get_post_meta($id, "_rodeio_managed_route", true) !== ""));
    }
    public static function register_type()
    {
        register_post_type("rodeio_layout", [
            "labels" => [
                "name" => "Rodeio · Ajustes",
                "singular_name" => "Área do site",
                "edit_item" => "Editar área do site",
                "all_items" => "Menu, rodapé e links úteis",
            ],
            "public" => false,
            "publicly_queryable" => false,
            "show_ui" => true,
            "show_in_menu" => false,
            "show_in_rest" => false,
            "exclude_from_search" => true,
            "rewrite" => false,
            "query_var" => false,
            "supports" => ["title", "editor", "revisions"],
            "menu_icon" => "dashicons-admin-customizer",
            "capability_type" => "page",
            "map_meta_cap" => true,
            "capabilities" => [
                "create_posts" => "do_not_allow",
                "edit_posts" => "manage_options",
                "edit_others_posts" => "manage_options",
                "publish_posts" => "manage_options",
                "read_private_posts" => "manage_options",
                "delete_posts" => "manage_options",
            ],
        ]);
    }
    private static function field($key, $label, $type = "text", $extra = [])
    {
        return array_merge(
            [
                "key" => "field_rde_" . $key,
                "name" => "rde_" . $key,
                "label" => $label,
                "type" => $type,
            ],
            $extra,
        );
    }
    public static function fields()
    {
        if (!function_exists("acf_add_local_field_group")) {
            return;
        }
        $hidden = ["readonly" => 1, "wrapper" => ["class" => "rde-binding"]];
        $fields = [
            self::field("intro", "Como editar", "message", [
                "message" =>
                    "Escolha uma seção, encontre o conteúdo e faça sua alteração. Para publicar, clique em Atualizar. As mudanças mantêm o desenho do site.",
                "esc_html" => 1,
            ]),
            self::field("base", "Versão de edição", "text", $hidden),
        ];
        foreach (
            [
                "texts" => "Textos",
                "images" => "Imagens",
                "links" => "Links e botões",
                "menus" => "Menus",
            ]
            as $kind => $label
        ) {
            $prefix = $kind . "_";
            $sub = [
                self::field($prefix . "context", "Identificação", "text", ["readonly" => 1, "wrapper" => ["class" => "rde-context"]]),
                self::field($prefix . "key", "Referência", "text", $hidden),
            ];
            if ($kind === "texts") {
                $sub[] = self::field($prefix . "value", "Texto", "textarea", [
                    "rows" => 3,
                    "new_lines" => "",
                    "required" => 1,
                    "instructions" =>
                        "Edite a frase. As fontes, os destaques e a posição no site são mantidos.",
                ]);
            }
            if ($kind === "images") {
                $sub[] = self::field($prefix . "url", "Usar uma imagem por endereço", "text", [
                    "instructions" =>
                        "Use a seleção abaixo para escolher/enviar uma imagem ou substitua o endereço por uma imagem HTTP(S).",
                ]);
                $sub[] = self::field($prefix . "pick", "Trocar foto", "image", [
                    "return_format" => "id",
                    "preview_size" => "medium",
                    "library" => "all",
                    "mime_types" => "jpg,jpeg,png,webp,avif",
                ]);
                $sub[] = self::field($prefix . "alt", "O que aparece nesta foto?", "text", [
                    "instructions" =>
                        "Atualize a descrição ao trocar a foto. Imagens decorativas podem ficar sem descrição.",
                ]);
                $sub[] = self::field($prefix . "kind", "Tipo", "text", $hidden);
                $sub[] = self::field($prefix . "mobile", "Versão para celular (opcional)", "image", [
                    "return_format" => "id",
                    "preview_size" => "medium",
                    "mime_types" => "jpg,jpeg,png,webp,avif",
                    "conditional_logic" => [
                        [
                            [
                                "field" => "field_rde_images_kind",
                                "operator" => "==",
                                "value" => "picture",
                            ],
                        ],
                    ],
                    "instructions" =>
                        "Nos banners, substitui as versões em retrato. Sem seleção, a imagem principal será usada.",
                ]);
            }
            if ($kind === "links") {
                $sub[] = self::field($prefix . "url", "Endereço de destino", "text", [
                    "instructions" =>
                        "Escolha a ação e informe o destino. Você também pode editar o nome aqui quando o link tiver um único texto.",
                ]);
            }
            if ($kind === "menus") {
                $sub[] = self::field($prefix . "items", "Itens", "repeater", [
                    "layout" => "block",
                    "min" => 1,
                    "max" => 12,
                    "button_label" => "Adicionar link",
                    "collapsed" => "field_rde_menuitem_label",
                    "sub_fields" => [
                        self::field("menuitem_key", "Referência", "text", $hidden),
                        self::field("menuitem_label", "Rótulo", "text", ["required" => 1]),
                        self::field("menuitem_url", "Destino", "text", ["required" => 1]),
                        self::field("menuitem_new_tab", "Abrir em nova aba", "true_false", [
                            "ui" => 1,
                        ]),
                    ],
                ]);
            }
            $fields[] = self::field("tab_" . $kind, $label, "tab");
            $fields[] = self::field($kind, $label, "repeater", [
                "layout" => "block",
                "button_label" => "Os itens vêm do HTML",
                "collapsed" => "field_rde_" . $prefix . "context",
                "sub_fields" => $sub,
                "instructions" =>
                    $kind === "menus"
                        ? "Edite rótulos e destinos; arraste os itens para reordenar. Os menus desktop e mobile são identificados separadamente."
                        : "Encontre o item pela prévia e clique em Editar. Depois de alterar, use Atualizar para publicar.",
            ]);
        }
        $location = [[["param" => "post_type", "operator" => "==", "value" => "rodeio_layout"], ["param" => "post", "operator" => "!=", "value" => (string) Rodeio_Editor_Data::id()]]];
        foreach (
            get_posts([
                "post_type" => "page",
                "post_status" => "publish",
                "numberposts" => -1,
                "meta_key" => "_rodeio_managed_route",
                "fields" => "ids",
            ])
            as $id
        ) {
            if (get_post_meta($id, "_rde_snapshot", true)) {
                $location[] = [["param" => "post", "operator" => "==", "value" => (string) $id]];
            }
        }
        acf_add_local_field_group([
            "key" => "group_rodeio_editor_v1",
            "title" => "Rodeio · Estúdio de conteúdo",
            "fields" => $fields,
            "location" => $location,
            "position" => "acf_after_title",
            "style" => "default",
            "active" => true,
            "show_in_rest" => false,
            "menu_order" => 0,
        ]);
    }
    public static function fragment($content)
    {
        if (preg_match('~^<!-- wp:html -->(.*)<!-- /wp:html -->$~s', $content, $m)) {
            return $m[1];
        }
        return do_blocks($content);
    }
    public static function snapshot($id, $content = null)
    {
        $content = $content === null ? get_post_field("post_content", $id, "raw") : $content;
        $doc = new Rodeio_Editor_Document(self::fragment($content));
        return [
            "token" => hash("sha256", $content),
            "data" => $doc->capture(),
            "content" => $content,
        ];
    }
    public static function encode($data, $token)
    {
        $out = ["field_rde_base" => $token];
        foreach (self::$parts as $kind => $keys) {
            $rows = [];
            foreach ($data[$kind] ?? [] as $row) {
                $r = [];
                foreach ($keys as $key) {
                    if ($key === "items") {
                        $items = [];
                        foreach ($row["items"] as $item) {
                            $v = [];
                            foreach (["key", "label", "url", "new_tab"] as $k) {
                                $v["field_rde_menuitem_" . $k] = $item[$k] ?? "";
                            }
                            $items[] = $v;
                        }
                        $r["field_rde_menus_items"] = $items;
                    } else {
                        $r["field_rde_" . $kind . "_" . $key] = $row[$key] ?? "";
                    }
                }
                $rows[] = $r;
            }
            $out["field_rde_" . $kind] = $rows;
        }
        return $out;
    }
    public static function decode($raw)
    {
        $out = [];
        foreach (self::$parts as $kind => $keys) {
            $rows = [];
            foreach ($raw["field_rde_" . $kind] ?? [] ?: [] as $row) {
                if (!is_array($row)) {
                    throw new RuntimeException("Campos inválidos.");
                }
                $r = [];
                foreach ($keys as $key) {
                    $v = $row["field_rde_" . $kind . "_" . $key] ?? "";
                    if ($key === "items") {
                        $items = [];
                        foreach ($v ?: [] as $item) {
                            $i = [];
                            foreach (["key", "label", "url", "new_tab"] as $k) {
                                $value = $item["field_rde_menuitem_" . $k] ?? "";
                                $i[$k] = $k === "new_tab" ? (int) (bool) $value : (string) $value;
                            }
                            $items[] = $i;
                        }
                        $r[$key] = $items;
                    } else {
                        $r[$key] = in_array($key, ["pick", "mobile"], true)
                            ? (int) $v
                            : (string) $v;
                    }
                }
                $rows[] = $r;
            }
            $out[$kind] = $rows;
        }
        return $out;
    }
    public static function remember($id, $snapshot, $write_fields = true)
    {
        $history = get_post_meta($id, "_rde_history", true);
        if (!is_array($history)) {
            $history = [];
        }
        unset($history[$snapshot["token"]]);
        $history[$snapshot["token"]] = ["token" => $snapshot["token"], "data" => $snapshot["data"]];
        if (count($history) > 8) {
            $history = array_slice($history, -8, null, true);
        }
        update_post_meta($id, "_rde_history", wp_slash($history));
        update_post_meta(
            $id,
            "_rde_snapshot",
            wp_slash(["token" => $snapshot["token"], "data" => $snapshot["data"]]),
        );
        if ($write_fields && function_exists("update_field")) {
            foreach (self::encode($snapshot["data"], $snapshot["token"]) as $key => $value) {
                update_field($key, wp_slash($value), $id);
            }
        }
    }
    private static function prepare($id, $raw)
    {
        $token = (string) ($raw["field_rde_base"] ?? "");
        $history = get_post_meta($id, "_rde_history", true);
        $base = $history[$token] ?? null;
        if (!$base) {
            throw new RuntimeException(
                "A versão desta edição expirou. Recarregue a página antes de salvar.",
            );
        }
        $desired = self::decode($raw);
        $current = get_post_field("post_content", $id, "raw");
        $doc = new Rodeio_Editor_Document(self::fragment($current));
        $merged = $doc->merge($base["data"], $desired);
        $content =
            $merged === null
                ? $current
                : (get_post_type($id) === "page"
                    ? "<!-- wp:html -->" . $merged . "<!-- /wp:html -->"
                    : $merged);
        return [
            "content" => $content,
            "snapshot" => self::snapshot($id, $content),
            "before" => self::snapshot($id, $current),
        ];
    }
    public static function validate()
    {
        $id = (int) ($_POST["_acf_post_id"] ?? ($_POST["post_ID"] ?? 0));
        if (
            !self::supported($id) ||
            empty($_POST["acf"]) ||
            !isset($_POST["acf"]["field_rde_base"]) ||
            !current_user_can("edit_post", $id) ||
            self::$busy
        ) {
            return;
        }
        try {
            self::prepare($id, wp_unslash($_POST["acf"]));
        } catch (Throwable $e) {
            acf_add_validation_error("", $e->getMessage());
        }
    }
    public static function before_save($id)
    {
        if (
            self::$busy ||
            !self::supported($id) ||
            empty($_POST["acf"]) ||
            !isset($_POST["acf"]["field_rde_base"]) ||
            !current_user_can("edit_post", $id)
        ) {
            return;
        }
        try {
            $pending = self::prepare($id, wp_unslash($_POST["acf"]));
            self::$pending[$id] = $pending;
            $fresh = self::encode($pending["snapshot"]["data"], $pending["snapshot"]["token"]);
            foreach ($fresh as $key => $value) {
                $_POST["acf"][$key] = wp_slash($value);
            }
        } catch (Throwable $e) {
            self::$pending[$id] = ["error" => $e->getMessage()];
            $fresh = self::snapshot($id);
            foreach (self::encode($fresh["data"], $fresh["token"]) as $key => $value) {
                $_POST["acf"][$key] = wp_slash($value);
            }
            set_transient("rde_editor_error_" . get_current_user_id(), $e->getMessage(), 120);
        }
    }
    public static function after_save($id)
    {
        if (self::$busy || !isset(self::$pending[$id])) {
            return;
        }
        $pending = self::$pending[$id];
        unset(self::$pending[$id]);
        if (isset($pending["error"])) {
            return;
        }
        self::$busy = true;
        try {
            if ($pending["content"] !== get_post_field("post_content", $id, "raw")) {
                $result = wp_update_post(
                    wp_slash(["ID" => $id, "post_content" => $pending["content"]]),
                    true,
                );
                if (is_wp_error($result)) {
                    throw new RuntimeException("Não foi possível atualizar o HTML.");
                }
            }
            self::remember($id, $pending["snapshot"]);
            self::propagate($id, $pending["before"], $pending["snapshot"]);
            self::flush();
        } finally {
            self::$busy = false;
        }
    }
    public static function html_saved($id, $post, $update, $before)
    {
        if (self::$busy || !self::supported($id)) {
            return;
        }
        self::$busy = true;
        try {
            $old = $before ? self::snapshot($id, $before->post_content) : null;
            $now = self::snapshot($id);
            self::remember($id, $now);
            if ($old) {
                self::propagate($id, $old, $now);
            }
            self::flush();
        } catch (Throwable $e) {
            set_transient("rde_editor_error_" . get_current_user_id(), $e->getMessage(), 120);
        } finally {
            self::$busy = false;
        }
    }
    public static function flush()
    {
        wp_cache_delete("rde_fragments", "rodeio");
        if (function_exists("w3tc_flush_all")) {
            w3tc_flush_all();
        }
    }
    public static function readonly_rows($field)
    {
        $id = (int) ($_GET["post"] ?? ($_POST["_acf_post_id"] ?? ($_POST["post_ID"] ?? 0)));
        if (!self::supported($id)) {
            return $field;
        }
        $kind = substr($field["key"], strlen("field_rde_"));
        $s = get_post_meta($id, "_rde_snapshot", true);
        $count = count($s["data"][$kind] ?? []);
        if (!$count) {
            return false;
        }
        $field["min"] = $count;
        $field["max"] = $count;
        return $field;
    }
    public static function admin_assets()
    {
        Rodeio_Editor_UI::enqueue();
    }
    public static function preview_image($field)
    {
        if (($field["key"] ?? "") !== "field_rde_images_url" || empty($field["value"])) {
            return;
        }
        echo '<img class="rde-image-preview" src="' .
            esc_url($field["value"]) .
            '" alt="Prévia da imagem atual" loading="lazy" />';
    }
    public static function notices()
    {
        $message = get_transient("rde_editor_error_" . get_current_user_id());
        if ($message) {
            delete_transient("rde_editor_error_" . get_current_user_id());
            echo '<div class="notice notice-error"><p>' . esc_html($message) . "</p></div>";
        }
    }
    public static function all_ids()
    {
        $ids = array_map(
            "intval",
            get_posts([
                "post_type" => "page",
                "post_status" => "publish",
                "numberposts" => -1,
                "meta_key" => "_rodeio_managed_route",
                "fields" => "ids",
            ]),
        );
        return array_values(
            array_unique(
                array_merge(
                    $ids,
                    array_map("intval", array_values(get_option("_rde_fragment_ids", []))),
                ),
            ),
        );
    }
    public static function settings($settings_id = null)
    {
        $ids = get_option("_rde_fragment_ids", []);
        if ($settings_id !== null) {
            $ids["settings"] = (int) $settings_id;
        }
        if (empty($ids["settings"])) {
            return [];
        }
        $doc = new Rodeio_Editor_Document(
            get_post_field("post_content", (int) $ids["settings"], "raw"),
        );
        $out = [];
        foreach ($doc->xpath->query(".//*[@data-rde-setting]", $doc->root) as $node) {
            $key = $node->getAttribute("data-rde-setting");
            $out[$key] = [
                "value" =>
                    $node->tagName === "a" ? $node->getAttribute("href") : trim($node->textContent),
                "kind" => $node->tagName === "a" ? "url" : "text",
            ];
        }
        return $out;
    }
    public static function propagate($id, $before, $after, $scope = null, $settings_id = null)
    {
        $ids = get_option("_rde_fragment_ids", []);
        if ($settings_id !== null) {
            $ids["settings"] = (int) $settings_id;
        }
        if (empty($ids["settings"])) {
            return;
        }
        $is_settings = $id === (int) $ids["settings"];
        $changes = [];
        $settings_before = [];
        if ($is_settings) {
            $old_doc = new Rodeio_Editor_Document(self::fragment($before["content"]));
            $new_doc = new Rodeio_Editor_Document(self::fragment($after["content"]));
            foreach ($old_doc->xpath->query(".//*[@data-rde-setting]", $old_doc->root) as $old) {
                $key = $old->getAttribute("data-rde-setting");
                $settings_before[$key] = [
                    "value" =>
                        $old->tagName === "a"
                            ? $old->getAttribute("href")
                            : trim($old->textContent),
                    "kind" => $old->tagName === "a" ? "url" : "text",
                ];
                foreach (
                    $new_doc->xpath->query(".//*[@data-rde-setting]", $new_doc->root)
                    as $new
                ) {
                    if ($new->getAttribute("data-rde-setting") === $key) {
                        $a =
                            $old->tagName === "a"
                                ? $old->getAttribute("href")
                                : trim($old->textContent);
                        $b =
                            $new->tagName === "a"
                                ? $new->getAttribute("href")
                                : trim($new->textContent);
                        if ($a !== $b && $a !== "" && $b !== "") {
                            $changes[] = [$a, $b, $old->tagName === "a" ? "url" : "text"];
                        }
                    }
                }
            }
        } else {
            $facts = self::settings($settings_id);
            foreach (["texts" => "value", "links" => "url"] as $kind => $prop) {
                $old = [];
                foreach ($before["data"][$kind] as $row) {
                    $old[$row["key"]] = $row[$prop];
                }
                foreach ($after["data"][$kind] as $row) {
                    $value = $old[$row["key"]] ?? null;
                    if ($value === null || $value === $row[$prop]) {
                        continue;
                    }
                    foreach ($facts as $fact) {
                        if (
                            $fact["value"] === $value &&
                            $fact["kind"] === ($kind === "links" ? "url" : "text")
                        ) {
                            $changes[] = [$value, $row[$prop], $fact["kind"]];
                        }
                    }
                }
            }
        }
        if (!$is_settings) {
            $old_menu_urls = [];
            foreach ($before["data"]["menus"] ?? [] as $menu) foreach ($menu["items"] as $item) $old_menu_urls[$item["key"]] = $item["url"];
            foreach ($after["data"]["menus"] ?? [] as $menu) foreach ($menu["items"] as $item) {
                $old_url = $old_menu_urls[$item["key"]] ?? null;
                if ($old_url === null || $old_url === $item["url"]) continue;
                foreach (self::settings($settings_id) as $fact) if ($fact["kind"] === "url" && $fact["value"] === $old_url) $changes[] = [$old_url, $item["url"], "url"];
            }
        }
        if (!$changes) {
            return;
        }
        $facts = $is_settings ? $settings_before : self::settings($settings_id);
        foreach ($changes as [$old, $new, $kind]) {
            if (
                $kind === "text" &&
                isset($facts["phone_display"]) &&
                $facts["phone_display"]["value"] === $old
            ) {
                $digits = preg_replace("/\D/", "", $new);
                if (strlen($digits) === 10 || strlen($digits) === 11) {
                    $digits = "55" . $digits;
                }
                if (preg_match('/^55\d{10,11}$/', $digits) && isset($facts["phone"])) {
                    $changes[] = [$facts["phone"]["value"], "tel:+" . $digits, "url"];
                }
            }
            if ($kind === "url" && isset($facts["phone"]) && $facts["phone"]["value"] === $old) {
                $digits = preg_replace("/\D/", "", $new);
                if (strpos($digits, "55") === 0) {
                    $digits = substr($digits, 2);
                }
                if (
                    (strlen($digits) === 10 || strlen($digits) === 11) &&
                    isset($facts["phone_display"])
                ) {
                    $changes[] = [
                        $facts["phone_display"]["value"],
                        "(" .
                        substr($digits, 0, 2) .
                        ") " .
                        substr($digits, 2, -4) .
                        "-" .
                        substr($digits, -4),
                        "text",
                    ];
                }
            }
        }
        foreach ($scope === null ? self::all_ids() : $scope as $other) {
            $content = get_post_field("post_content", $other, "raw");
            $doc = new Rodeio_Editor_Document(self::fragment($content));
            $dirty = false;
            foreach ($changes as [$old, $new, $kind]) {
                if ($kind === "url") {
                    foreach (
                        $doc->xpath->query(".//*[@href or @src or @data-menu-url]", $doc->root)
                        as $node
                    ) {
                        foreach (["href", "src", "data-menu-url"] as $attr) {
                            if ($node->getAttribute($attr) === $old) {
                                $node->setAttribute(
                                    $attr,
                                    Rodeio_Editor_Document::url(
                                        $new,
                                        $attr === "href" ? "href" : "src",
                                    ),
                                );
                                $dirty = true;
                            }
                        }
                    }
                }
                if ($kind === "url" && isset($facts["whatsapp"]) && $old === $facts["whatsapp"]["value"] && preg_match('~^https://wa\.me/(55)(\d{2})(\d{4,5})(\d{4})$~', $new, $phone_parts)) {
                    $old_digits=preg_replace('/\D/','',$old);
                    foreach($doc->xpath->query('.//a[@href]',$doc->root) as $anchor) if($anchor->getAttribute('href')===$new) {
                        foreach($doc->xpath->query('.//text()',$anchor) as $text) if(preg_replace('/\D/','',$text->nodeValue)===$old_digits) {
                            $text->nodeValue='+55 ('.$phone_parts[2].') '.$phone_parts[3].'-'.$phone_parts[4];$dirty=true;
                        }
                    }
                }
                if ($kind === "text") {
                    foreach ($doc->xpath->query(".//text()", $doc->root) as $node) {
                        if (
                            $doc->ancestor($node, static function ($p) {
                                return in_array($p->tagName, ["script", "style", "svg"], true);
                            })
                        ) {
                            continue;
                        }
                        if (strpos($node->nodeValue, $old) !== false) {
                            $node->nodeValue = str_replace($old, $new, $node->nodeValue);
                            $dirty = true;
                        }
                    }
                }
            }
            if (!$dirty) {
                continue;
            }
            $new_content = $doc->html();
            if (get_post_type($other) === "page") {
                $new_content = "<!-- wp:html -->" . $new_content . "<!-- /wp:html -->";
            }
            $result = wp_update_post(
                wp_slash(["ID" => $other, "post_content" => $new_content]),
                true,
            );
            if (is_wp_error($result)) {
                throw new RuntimeException("Não foi possível atualizar um conteúdo compartilhado.");
            }
            self::remember($other, self::snapshot($other));
        }
    }
    public static function render($html, $page, $fragments = null)
    {
        if ($fragments === null && get_option("_rde_editor_version") !== self::VERSION) {
            return $html;
        }
        $ids = $fragments === null ? get_option("_rde_fragment_ids", []) : $fragments;
        foreach (["header", "footer", "dialogs"] as $kind) {
            if (empty($ids[$kind])) {
                continue;
            }
            $id = (int) $ids[$kind];
            $post = get_post($id);
            if (!$post || $post->post_status !== "private") {
                continue;
            }
            $source = $post->post_content;
            if (hash("sha256", $source) === get_post_meta($id, "_rde_seed_hash", true)) {
                continue;
            }
            $doc = new Rodeio_Editor_Document($source);
            if ($kind === "header") {
                $current = wp_parse_url(home_url($_SERVER["REQUEST_URI"] ?? "/"), PHP_URL_PATH);
                $site_header = $doc->xpath->query(".//header", $doc->root)->item(0);
                if ($site_header) {
                    $classes = array_values(
                        array_filter(
                            explode(" ", $site_header->getAttribute("class")),
                            static function ($class) {
                                return $class !== "header-home" && $class !== "";
                            },
                        ),
                    );
                    if ($current === "/") {
                        $classes[] = "header-home";
                    }
                    $site_header->setAttribute("class", implode(" ", $classes));
                }
                foreach ($doc->xpath->query(".//nav//a", $doc->root) as $a) {
                    $a->removeAttribute("aria-current");
                    $href = $a->getAttribute("href");
                    $path = parse_url($href, PHP_URL_PATH);
                    if (
                        $path &&
                        ($path === "/"
                            ? $current === "/"
                            : strpos($current, trailingslashit($path)) === 0)
                    ) {
                        $a->setAttribute("aria-current", "page");
                    }
                }
            }
            foreach ($doc->root->childNodes as $node) {
                if (!($node instanceof DOMElement)) {
                    continue;
                }
                $tag = $node->tagName;
                $id_attr = $node->getAttribute("id");
                $replacement = $doc->dom->saveHTML($node);
                if (in_array($tag, ["header", "footer"], true)) {
                    $pattern = "~<" . $tag . "\b[^>]*>.*?</" . $tag . ">~s";
                    $html = preg_replace_callback(
                        $pattern,
                        static function () use ($replacement) {
                            return $replacement;
                        },
                        $html,
                        1,
                    );
                } elseif ($tag === "dialog" && $id_attr !== "") {
                    $pattern =
                        '~<dialog\b(?=[^>]*\bid="' .
                        preg_quote($id_attr, "~") .
                        '"|[^>]*\bid=\x27' .
                        preg_quote($id_attr, "~") .
                        '\x27)[^>]*>.*?</dialog>~s';
                    $html = preg_replace_callback(
                        $pattern,
                        static function () use ($replacement) {
                            return $replacement;
                        },
                        $html,
                        1,
                        $replaced,
                    );
                    if (!$replaced && $kind === "dialogs") {
                        $html = str_replace("</body>", $replacement . "</body>", $html);
                    }
                }
            }
        }
        if (
            strpos($html, 'data-rde-image-changed="1"') !== false &&
            strpos($html, "home-slideshow") !== false
        ) {
            $d = new Rodeio_Editor_Document(self::fragment($page->post_content));
            $first = $d->xpath->query(".//*[@data-hero-slide]//img")->item(0);
            if ($first && $first->hasAttribute("data-rde-image-changed")) {
                $html = preg_replace('~<link\b(?=[^>]*\bas="image")[^>]*>~i', "", $html);
            }
        }
        return Rodeio_Menu_Pdf::apply($html);
    }
}
add_action("init", ["Rodeio_Editor", "register_type"], 5);
add_action("acf/init", ["Rodeio_Editor", "fields"]);
add_action("acf/validate_save_post", ["Rodeio_Editor", "validate"]);
add_action("acf/save_post", ["Rodeio_Editor", "before_save"], 1);
add_action("acf/save_post", ["Rodeio_Editor", "after_save"], 20);
add_action("wp_after_insert_post", ["Rodeio_Editor", "html_saved"], 100, 4);
foreach (["texts", "images", "links", "menus"] as $kind) {
    add_filter("acf/prepare_field/key=field_rde_" . $kind, ["Rodeio_Editor", "readonly_rows"]);
}
add_action("acf/input/admin_enqueue_scripts", ["Rodeio_Editor", "admin_assets"]);
add_action("acf/render_field/type=text", ["Rodeio_Editor", "preview_image"]);
add_action("admin_notices", ["Rodeio_Editor", "notices"]);
add_filter("user_can_richedit", static function ($can) {
    $screen = function_exists("get_current_screen") ? get_current_screen() : null;
    if ($screen && $screen->post_type === "rodeio_layout") {
        return false;
    }
    $id = (int) ($_GET["post"] ?? ($_POST["post_ID"] ?? 0));
    return Rodeio_Editor::supported($id) ? false : $can;
});

add_filter(
    "use_block_editor_for_post",
    static function ($use, $post) {
        return Rodeio_Editor::supported($post->ID) ? false : $use;
    },
    20,
    2,
);

// Keep local business metadata aligned with the visible, edited native page.
add_filter(
    "wpseo_schema_graph",
    static function ($graph, $context) {
        $original = $graph;
        try {
            if (get_option("_rde_editor_version") !== Rodeio_Editor::VERSION) {
                return $graph;
            }
            $id = (int) ($context->indexable->object_id ?? 0);
            $route = get_post_meta($id, "_rodeio_managed_route", true);
            if (!$route) {
                return $graph;
            }
            $settings = Rodeio_Editor::settings();
            $phone = $settings["phone"]["value"] ?? "";
            $logo = null;
            $fragments = get_option("_rde_fragment_ids", []);
            if (!empty($fragments["header"])) {
                $header = new Rodeio_Editor_Document(
                    get_post_field("post_content", (int) $fragments["header"], "raw"),
                );
                $logo = $header->xpath
                    ->query(".//header//img[@data-rde-image-changed]", $header->root)
                    ->item(0);
            }
            $unit = in_array($route, ["/restaurantes/jardins", "/restaurantes/iguatemi"], true);
            $doc = $unit
                ? new Rodeio_Editor_Document(
                    Rodeio_Editor::fragment(get_post_field("post_content", $id, "raw")),
                )
                : null;
            foreach ($graph as &$node) {
                $types = (array) ($node["@type"] ?? []);
                if (in_array("Organization", $types, true) && strpos($phone, "tel:") === 0) {
                    $number = substr($phone, 4);
                    $node["telephone"] = $number;
                    $node["contactPoint"] = [
                        "@type" => "ContactPoint",
                        "telephone" => $number,
                        "contactType" => "reservas e atendimento",
                        "availableLanguage" => "pt-BR",
                    ];
                }
                if (in_array("Organization", $types, true) && $logo) {
                    $url = $logo->getAttribute("src");
                    $url = strpos($url, "/") === 0 ? home_url($url) : $url;
                    $logo_id = is_array($node["logo"] ?? null)
                        ? $node["logo"]["@id"] ?? home_url("/#logo")
                        : home_url("/#logo");
                    $node["logo"] = [
                        "@type" => "ImageObject",
                        "@id" => $logo_id,
                        "url" => $url,
                        "contentUrl" => $url,
                        "width" => (int) $logo->getAttribute("width"),
                        "height" => (int) $logo->getAttribute("height"),
                    ];
                    if (isset($node["image"])) {
                        $node["image"] = ["@id" => $logo_id];
                    }
                }
                if (!$unit || !in_array("Restaurant", $types, true)) {
                    continue;
                }
                $address = $doc->xpath
                    ->query(
                        './/*[contains(concat(" ",normalize-space(@class)," ")," visit-address ")]//address',
                        $doc->root,
                    )
                    ->item(0);
                if ($address) {
                    $text = [];
                    foreach ($address->childNodes as $child) {
                        if ($child instanceof DOMText && trim($child->nodeValue) !== "") {
                            $text[] = trim($child->nodeValue);
                        }
                    }
                    if (isset($text[0])) {
                        $node["address"]["streetAddress"] = $text[0];
                    }
                    if (preg_match("/CEP\s*([\d-]+)/u", $address->textContent, $m)) {
                        $node["address"]["postalCode"] = $m[1];
                    }
                }
                $hours = [];
                $day_map = [
                    "segunda a quinta" => ["Monday", "Tuesday", "Wednesday", "Thursday"],
                    "sexta e sabado" => ["Friday", "Saturday"],
                    "domingo e feriados" => ["Sunday"],
                    "sexta, sabado, domingo e feriados" => ["Friday", "Saturday", "Sunday"],
                ];
                foreach (
                    $doc->xpath->query(
                        './/*[contains(concat(" ",normalize-space(@class)," ")," visit-hours ")]//li',
                        $doc->root,
                    )
                    as $li
                ) {
                    $day = $li->getElementsByTagName("span")->item(0);
                    $time = $li->getElementsByTagName("strong")->item(0);
                    if (!$day || !$time) {
                        continue;
                    }
                    $key = strtolower(remove_accents(trim($day->textContent)));
                    if (!isset($day_map[$key])) {
                        $hours = [];
                        break;
                    }
                    foreach (explode("/", $time->textContent) as $range) {
                        if (
                            !preg_match(
                                "/(\d{1,2})[h:](\d{2})?\s*às\s*(\d{1,2})[h:](\d{2})?/u",
                                $range,
                                $m,
                            )
                        ) {
                            $hours = [];
                            break 2;
                        }
                        $hours[] = [
                            "@type" => "OpeningHoursSpecification",
                            "dayOfWeek" => array_map(static function ($d) {
                                return "https://schema.org/" . $d;
                            }, $day_map[$key]),
                            "opens" => sprintf("%02d:%02d", (int) $m[1], (int) ($m[2] ?? 0)),
                            "closes" => sprintf("%02d:%02d", (int) $m[3], (int) ($m[4] ?? 0)),
                        ];
                    }
                }
                if ($hours) {
                    $node["openingHoursSpecification"] = $hours;
                } else {
                    unset($node["openingHoursSpecification"]);
                }
                $links = $doc->xpath->query(
                    './/*[contains(concat(" ",normalize-space(@class)," ")," visit-address ")]//a[@href]',
                    $doc->root,
                );
                if ($links->length) {
                    $node["hasMap"] = $links->item(0)->getAttribute("href");
                }
                $reservation = $doc->xpath->query(
                    './/*[contains(concat(" ",normalize-space(@class)," ")," visit-reservation-actions ")]//a[@href]',
                    $doc->root,
                );
                if ($reservation->length) {
                    $node["acceptsReservations"] = $reservation->item(0)->getAttribute("href");
                }
                $photo = $doc->xpath->query(".//*[@data-gallery]//img[@src]", $doc->root)->item(0);
                if ($photo) {
                    $url = $photo->getAttribute("src");
                    $node["image"] = strpos($url, "/") === 0 ? home_url($url) : $url;
                }
                $heading = $doc->xpath->query('.//*[@id="unit-title"]//text()', $doc->root);
                $names = [];
                foreach ($heading as $part) {
                    if (trim($part->nodeValue) !== "") {
                        $names[] = trim($part->nodeValue);
                    }
                }
                if ($names) {
                    $node["name"] = implode(" ", $names);
                }
            }
            unset($node);
            return $graph;
        } catch (Throwable $e) {
            error_log("Rodeio editor: schema fallback retained.");
            return $original;
        }
    },
    25,
    2,
);

add_filter("wp_insert_post_data", static function ($data) {
    if (
        ($data["post_type"] ?? "") === "rodeio_layout" &&
        !in_array($data["post_status"], ["trash", "auto-draft"], true)
    ) {
        $data["post_status"] = "private";
    }
    return $data;
});
