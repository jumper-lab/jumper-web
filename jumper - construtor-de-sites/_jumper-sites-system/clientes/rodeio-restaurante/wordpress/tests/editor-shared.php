<?php
/** Isolated shared-data integration; creates and removes private fixtures. */
function rodeio_editor_shared_contract()
{
    $saved = $_POST;
    unset($_POST["acf"]);
    $ids = [];
    $checks = [];
    $hashes = [];
    foreach (
        get_posts(["post_type" => "page", "post_status" => "publish", "numberposts" => -1])
        as $p
    ) {
        $hashes[$p->ID] = hash("sha256", $p->post_content);
    }
    try {
        $settings =
            '<section><p data-rde-setting="phone_display">(11) 3474-1333</p><a data-rde-setting="phone" href="tel:+551134741333">Telefone</a><p data-rde-setting="address_jardins">Rua de verificação, 100</p></section>';
        $header =
            '<header><a href="tel:+551134741333">(11) 3474-1333</a><address>Rua de verificação, 100</address></header>';
        foreach ([$settings, $header] as $html) {
            $id = wp_insert_post(
                wp_slash([
                    "post_type" => "rodeio_layout",
                    "post_status" => "private",
                    "post_title" => "QA compartilhamento — temporário",
                    "post_content" => $html,
                ]),
                true,
            );
            if (is_wp_error($id)) {
                throw new Exception("Cannot create private shared fixture");
            }
            $ids[] = $id;
        }
        $before = Rodeio_Editor::snapshot($ids[0]);
        wp_update_post(
            wp_slash([
                "ID" => $ids[0],
                "post_content" => str_replace("(11) 3474-1333", "(11) 98765-4321", $settings),
            ]),
        );
        $after = Rodeio_Editor::snapshot($ids[0]);
        Rodeio_Editor::$busy = true;
        try {
            Rodeio_Editor::propagate($ids[0], $before, $after, $ids, $ids[0]);
        } finally {
            Rodeio_Editor::$busy = false;
        }
        foreach ($ids as $id) {
            $html = get_post_field("post_content", $id, "raw");
            if (
                strpos($html, "tel:+5511987654321") === false ||
                strpos($html, "(11) 98765-4321") === false
            ) {
                throw new Exception("Phone label and tel did not sync");
            }
        }
        $checks["shared_phone_updates_label_and_tel"] = true;
        $before = Rodeio_Editor::snapshot($ids[1]);
        wp_update_post(
            wp_slash([
                "ID" => $ids[1],
                "post_content" => str_replace(
                    "Rua de verificação, 100",
                    "Rua nova, 200",
                    $before["content"],
                ),
            ]),
        );
        $after = Rodeio_Editor::snapshot($ids[1]);
        Rodeio_Editor::$busy = true;
        try {
            Rodeio_Editor::propagate($ids[1], $before, $after, $ids, $ids[0]);
        } finally {
            Rodeio_Editor::$busy = false;
        }
        foreach ($ids as $id) {
            if (strpos(get_post_field("post_content", $id, "raw"), "Rua nova, 200") === false) {
                throw new Exception("Address reverse sync failed");
            }
        }
        $checks["html_shared_fact_updates_settings_and_other_copy"] = true;
        foreach ($hashes as $id => $hash) {
            if (hash("sha256", get_post_field("post_content", $id, "raw")) !== $hash) {
                throw new Exception("Public content changed during isolated test");
            }
        }
        $checks["public_content_unchanged"] = true;
        return $checks;
    } finally {
        unset($_POST["acf"]);
        foreach ($ids as $id) {
            wp_delete_post($id, true);
        }
        $_POST = $saved;
    }
}
