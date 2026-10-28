<?php
/** SEO for managed pages. Yoast owns live metadata; the release is the fallback. */
function rodeio_2026_seo_config() {
    static $config;
    if ($config === null) {
        $file = get_stylesheet_directory() . '/releases/__RELEASE__/seo.json';
        $decoded = is_readable($file) ? json_decode(file_get_contents($file), true) : null;
        $config = is_array($decoded) ? $decoded : [];
    }
    return $config;
}

function rodeio_2026_live_seo($html, $page) {
    if (!function_exists('YoastSEO')) return $html;
    try {
        $meta = YoastSEO()->meta->for_post($page->ID);
        if (!is_object($meta)) return $html;
        $result = $meta->get_head();
        $generated = is_object($result) ? ($result->html ?? '') : $result;
        if (!is_string($generated) || trim($generated) === '') return $html;
        // Yoast can omit its title presenter on the public template when the
        // theme renders its own head. Use the same API's title in that case.
        if (!preg_match('~<title\b[^>]*>.+?</title>~s', $generated)) {
            if (!is_string($meta->title) || $meta->title === '') return $html;
            $generated = '<title>' . esc_html($meta->title) . "</title>\n" . $generated;
        }
        // WordPress can own the robots presenter on public requests as well.
        if (!preg_match('~<meta\b(?=[^>]*\bname=["\x27]robots["\x27])~i', $generated)) {
            $robots = $meta->robots;
            if (!is_array($robots) || empty($robots)) return $html;
            $generated .= "\n" . '<meta name="robots" content="' . esc_attr(implode(', ', array_filter($robots, 'is_string'))) . '" />';
        }
        // Yoast may omit canonical on noindex pages. Keep a self-canonical there.
        if (!preg_match('~<link\b[^>]*rel=["\x27]canonical["\x27]~i', $generated)) {
            $canonical = get_post_meta($page->ID, '_yoast_wpseo_canonical', true) ?: get_permalink($page);
            $generated .= "\n" . '<link rel="canonical" href="' . esc_url($canonical) . '" />';
        }
        $output = preg_replace_callback('~(<head\b[^>]*>)(.*?)(</head>)~is', static function ($matches) use ($generated) {
            $head = $matches[2];
            $head = preg_replace('~<title\b[^>]*>.*?</title>~is', '', $head);
            $head = preg_replace('~<meta\b(?=[^>]*(?:\bname=["\x27](?:description|robots|twitter:[^"\x27]+)["\x27]|\bproperty=["\x27]og:[^"\x27]+["\x27]))[^>]*>~is', '', $head);
            $head = preg_replace('~<link\b(?=[^>]*\brel=["\x27]canonical["\x27])[^>]*>~is', '', $head);
            $head = preg_replace('~<script\b(?=[^>]*\btype=["\x27]application/ld\+json["\x27])[^>]*>.*?</script>~is', '', $head);
            return $matches[1] . $head . "\n" . $generated . "\n" . $matches[3];
        }, $html, 1);
        return is_string($output) ? $output : $html;
    } catch (Throwable $error) {
        error_log('Rodeio SEO: could not render Yoast metadata; approved release fallback retained.');
        return $html;
    }
}

function rodeio_2026_schema_graph($graph, $context) {
    $id = (int) ($context->indexable->object_id ?? 0);
    $route = $id ? get_post_meta($id, '_rodeio_managed_route', true) : '';
    if ($route === '') return $graph;
    $key = $route === '/' ? '/' : trailingslashit($route);
    $config = rodeio_2026_seo_config();
    if (empty($config['pages'][$key])) return $graph;
    $canonical = get_post_meta($id, '_yoast_wpseo_canonical', true) ?: get_permalink($id);
    $unit = $config['restaurants'][$key] ?? null;
    $organization = $config['organization'] ?? [];
    $has_organization = false;
    $crumbs = [['@type'=>'ListItem','position'=>1,'name'=>'Início','item'=>home_url('/')]];
    if ($id !== (int) get_option('page_on_front')) {
        $ancestors = array_reverse(get_post_ancestors($id));
        $ancestors[] = $id;
        foreach ($ancestors as $ancestor) {
            if ($ancestor === (int) get_option('page_on_front')) continue;
            $label = get_post_meta($ancestor, '_yoast_wpseo_bctitle', true) ?: get_the_title($ancestor);
            $crumbs[] = ['@type'=>'ListItem','position'=>count($crumbs)+1,'name'=>$label,'item'=>$ancestor===$id?$canonical:get_permalink($ancestor)];
        }
    }
    foreach ($graph as &$node) {
        $types = (array) ($node['@type'] ?? []);
        if (in_array('Organization', $types, true)) {
            $node = array_replace($organization, $node);
            $has_organization = true;
        }
        if (in_array('WebSite', $types, true) && isset($node['potentialAction'])) {
            // This site has no search UI. Do not advertise a non-functional search.
            $actions = isset($node['potentialAction']['@type']) ? [$node['potentialAction']] : $node['potentialAction'];
            $actions = array_values(array_filter($actions, static function ($action) { return ($action['@type'] ?? '') !== 'SearchAction'; }));
            if ($actions) $node['potentialAction'] = $actions; else unset($node['potentialAction']);
        }
        if (in_array('WebPage', $types, true)) {
            $node['@id'] = $canonical;
            $node['url'] = $canonical;
            $node['breadcrumb'] = ['@id'=>$canonical.'#breadcrumb'];
            if ($key === '/historia/') $node['@type'] = ['WebPage','AboutPage'];
            if (in_array($key, ['/sac/','/compliance/'], true)) $node['@type'] = ['WebPage','ContactPage'];
            if ($key === '/restaurantes/') $node['@type'] = ['WebPage','CollectionPage'];
            foreach (($node['potentialAction'] ?? []) as $i=>$action) if (($action['@type'] ?? '')==='ReadAction') $node['potentialAction'][$i]['target']=[$canonical];
            if ($unit) $node['mainEntity'] = ['@id'=>$unit['@id']];
        }
        if (in_array('BreadcrumbList', $types, true)) {
            $node['@id'] = $canonical.'#breadcrumb';
            $node['itemListElement'] = $crumbs;
        }
    }
    unset($node);
    if (!$has_organization && $organization) $graph[] = $organization;
    if ($unit) {
        $unit['mainEntityOfPage'] = ['@id'=>$canonical];
        $replaced = false;
        foreach ($graph as &$node) if (($node['@id'] ?? '') === $unit['@id']) { $node = array_replace($node, $unit); $replaced = true; }
        unset($node);
        if (!$replaced) $graph[] = $unit;
    }
    return $graph;
}
add_filter('wpseo_schema_graph', 'rodeio_2026_schema_graph', 20, 2);

function rodeio_2026_queue_seo_cache_purge($meta_id, $post_id, $key, $value) {
    if (strpos($key, '_yoast_wpseo_') !== 0 || get_post_meta($post_id, '_rodeio_managed_route', true) === '') return;
    static $queued = false;
    if ($queued) return;
    $queued = true;
    add_action('shutdown', static function () { if (function_exists('w3tc_flush_all')) w3tc_flush_all(); }, 999);
}
add_action('updated_post_meta', 'rodeio_2026_queue_seo_cache_purge', 10, 4);
add_action('added_post_meta', 'rodeio_2026_queue_seo_cache_purge', 10, 4);
add_action('deleted_post_meta', 'rodeio_2026_queue_seo_cache_purge', 10, 4);
