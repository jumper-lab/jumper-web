<?php
/** Supply a private QA fixture, never a live page. Restores its content in finally. */
function rodeio_editor_integration_contract($id)
{
    if (get_post_meta($id, "_rde_probe", true) !== "20261028") {
        throw new RuntimeException("Private QA fixture required");
    }
    $seed = get_post_meta($id, "_rde_probe_seed", true);
    $old_post = $_POST;
    $checks = [];
    try {
        unset($_POST["acf"]);
        wp_update_post(wp_slash(["ID" => $id, "post_content" => $seed]));
        Rodeio_Editor::remember($id, Rodeio_Editor::snapshot($id));
        $base = Rodeio_Editor::snapshot($id);
        $desired = $base["data"];
        $desired["texts"][0]["value"] = 'Aspas "preservadas", <b>texto</b> & barra \\ final';
        $desired["menus"][0]["items"] = array_reverse($desired["menus"][0]["items"]);
        $desired["links"][0]["url"] = "/eventos/";
        $_POST["_acf_post_id"] = $id;
        acf_save_post($id, wp_slash(Rodeio_Editor::encode($desired, $base["token"])));
        $now = Rodeio_Editor::snapshot($id);
        if ($now["data"]["texts"][0]["value"] !== $desired["texts"][0]["value"]) {
            throw new Exception("ACF → HTML failed");
        }
        $fields = get_field("rde_texts", $id);
        if ($fields[0]["rde_texts_value"] !== $desired["texts"][0]["value"]) {
            throw new Exception("ACF stored value differs");
        }
        if ($now["data"]["menus"][0]["items"][0]["label"] !== "Eventos") {
            throw new Exception("Menu save failed");
        }
        $checks["acf_to_html_and_menu"] = true;
        $checks["quotes_html_escaped_and_backslash"] = true;
        // The editor HTML request happens before the old metabox payload is saved.
        unset($_POST["acf"]);
        $base = $now;
        $html =
            '<h1>HTML editado diretamente</h1><p>Texto de apoio para testar a edição.</p><a href="/eventos/">Fazer uma reserva</a><nav aria-label="Menu de verificação"><a href="/eventos/">Eventos</a><a href="/historia/">Nossa história</a></nav><a data-gallery href="/wp-content/uploads/2026/10/rodeio-logo-preto.png"><img src="/wp-content/uploads/2026/10/rodeio-logo-preto.png" alt="Logo de verificação" width="756" height="212"></a>';
        wp_update_post(wp_slash(["ID" => $id, "post_content" => $html]));
        acf_save_post($id, wp_slash(Rodeio_Editor::encode($base["data"], $base["token"])));
        $now = Rodeio_Editor::snapshot($id);
        if (
            $now["data"]["texts"][0]["value"] !== "HTML editado diretamente" ||
            get_field("rde_texts", $id)[0]["rde_texts_value"] !== "HTML editado diretamente"
        ) {
            throw new Exception("Old metabox overwrote new HTML");
        }
        $checks["html_to_acf_with_stale_metabox"] = true;
        $old = Rodeio_Editor::snapshot($id);
        unset($_POST["acf"]);
        wp_update_post(
            wp_slash([
                "ID" => $id,
                "post_content" => str_replace(
                    "HTML editado diretamente",
                    "HTML mais recente",
                    $old["content"],
                ),
            ]),
        );
        $desired = $old["data"];
        $desired["texts"][0]["value"] = "Campo concorrente";
        acf_save_post($id, wp_slash(Rodeio_Editor::encode($desired, $old["token"])));
        $now = Rodeio_Editor::snapshot($id);
        if (
            $now["data"]["texts"][0]["value"] !== "HTML mais recente" ||
            !get_transient("rde_editor_error_" . get_current_user_id())
        ) {
            throw new Exception("Concurrent edit not protected");
        }
        $checks["concurrent_edit_does_not_overwrite"] = true;
        delete_transient("rde_editor_error_" . get_current_user_id());
        // Render a changed private header through the exact public replacement function.
        unset($_POST["acf"]);
        $header =
            '<header class="site-header"><a href="/">Marca</a></header><dialog id="navigation-dialog"><nav><a href="/historia/">Nossa história</a></nav></dialog>';
        wp_update_post(wp_slash(["ID" => $id, "post_content" => $header]));
        update_post_meta($id, "_rde_seed_hash", "different");
        $fake =
            '<html><head></head><body><header class="old">Antigo</header><dialog id="navigation-dialog">Antigo</dialog><main>Corpo</main><footer>Rodapé</footer></body></html>';
        $out = Rodeio_Editor::render($fake, get_post(801), ["header" => $id]);
        if (
            strpos($out, "site-header") === false ||
            strpos($out, "Nossa história") === false ||
            strpos($out, "<main>Corpo</main>") === false
        ) {
            throw new Exception("Global fragment injection failed");
        }
        $checks["global_header_injection_preserves_main"] = true;
        return ["private_probe" => $id, "checks" => $checks, "public_pages_changed" => false];
    } finally {
        unset($_POST["acf"]);
        wp_update_post(wp_slash(["ID" => $id, "post_content" => $seed]));
        Rodeio_Editor::remember($id, Rodeio_Editor::snapshot($id));
        delete_post_meta($id, "_rde_seed_hash");
        $_POST = $old_post;
    }
}
