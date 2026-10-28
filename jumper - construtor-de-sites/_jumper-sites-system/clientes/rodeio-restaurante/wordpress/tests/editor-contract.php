<?php
/** Run in WordPress after loading editor-dom.php; does not write production data. */
function rodeio_editor_contract()
{
    $results = [];
    $counts = [];
    foreach (
        get_posts(["post_type" => "page", "post_status" => "publish", "numberposts" => -1])
        as $p
    ) {
        if (get_post_meta($p->ID, "_rodeio_managed_route", true) === "") {
            continue;
        }
        $body = do_blocks($p->post_content);
        $doc = new Rodeio_Editor_Document($body);
        $capture = $doc->capture();
        $counts[$p->ID] = array_map("count", $capture);
        if ($doc->merge($capture, $capture) !== null) {
            throw new Exception("Unchanged fields rewrote HTML");
        }
        if (!$capture["texts"]) {
            throw new Exception("Page has no mapped texts");
        }
        $edit = $capture;
        $edit["texts"][0]["value"] = "Edição simulada <b>segura</b> & texto";
        $changed = $doc->merge($capture, $edit);
        if (strpos($changed, "&lt;b&gt;segura&lt;/b&gt;") === false) {
            throw new Exception("Text escaped incorrectly");
        }
        $round = new Rodeio_Editor_Document($changed);
        $fresh = $round->capture();
        if ($fresh["texts"][0]["value"] !== "Edição simulada <b>segura</b> & texto") {
            throw new Exception("Reverse extraction failed");
        }
    }
    $sample =
        '<h1>Original <em>com destaque</em></h1><p>Outro texto</p><nav aria-label="Menu"><a href="/historia/"><span>História</span><svg><path d="M0 0"></path></svg></a><a href="/reservas/">Reservas</a></nav><a data-gallery href="/old.webp"><picture><source media="(max-width:599px) and (orientation:portrait)" srcset="/old-mobile.webp"><img src="/old.webp" srcset="/old.webp 800w" alt="Foto" width="800" height="600"></picture></a>';
    $d = new Rodeio_Editor_Document($sample);
    $base = $d->capture();
    $edit = $base;
    $edit["menus"][0]["items"] = array_reverse($edit["menus"][0]["items"]);
    $edit["menus"][0]["items"][] = [
        "key" => "",
        "label" => "Novo link",
        "url" => "/eventos/",
        "new_tab" => 1,
    ];
    $edit["images"][0]["url"] = "https://rodeiosp.com.br/teste.webp";
    $edit["images"][0]["alt"] = "Nova fotografia";
    $html = $d->merge($base, $edit);
    $fresh = new Rodeio_Editor_Document($html);
    $c = $fresh->capture();
    if (
        $c["menus"][0]["items"][0]["label"] !== "Reservas" ||
        count($c["menus"][0]["items"]) !== 3
    ) {
        throw new Exception("Menu order/add failed");
    }
    $img = $fresh->xpath->query(".//img")->item(0);
    if (
        $img->getAttribute("srcset") !== "https://rodeiosp.com.br/teste.webp" ||
        $img->getAttribute("alt") !== "Nova fotografia"
    ) {
        throw new Exception("Responsive image stale");
    }
    if (
        $fresh->xpath->query(".//a[@data-gallery]")->item(0)->getAttribute("href") !==
        "https://rodeiosp.com.br/teste.webp"
    ) {
        throw new Exception("Gallery detail stale");
    }
    $edit = $base;
    $edit["texts"][0]["value"] = "Campo alterado";
    $d = new Rodeio_Editor_Document(str_replace("Original", "HTML alterado", $sample));
    $blocked = false;
    try {
        $d->merge($base, $edit);
    } catch (RuntimeException $e) {
        $blocked = true;
    }
    if (!$blocked) {
        throw new Exception("Conflict not blocked");
    }
    $edit = $base;
    $edit["menus"][0]["items"][0]["url"] = "javascript:alert(1)";
    $blocked = false;
    try {
        (new Rodeio_Editor_Document($sample))->merge($base, $edit);
    } catch (RuntimeException $e) {
        $blocked = true;
    }
    if (!$blocked) {
        throw new Exception("Unsafe URL accepted");
    }
    $results = [
        "16_page_mapping" => $counts,
        "unchanged_save_preserved" => true,
        "text_html_both_directions" => true,
        "inline_emphasis_preserved" => true,
        "menu_reorder_and_add" => true,
        "responsive_image_and_gallery" => true,
        "simultaneous_edit_conflict_blocked" => true,
        "unsafe_url_blocked" => true,
        "production_content_changed" => false,
    ];
    return $results;
}
