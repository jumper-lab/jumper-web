<?php
/**
 * Rodeio's approved Astro output is the source of truth for the public pages.
 * Native WordPress pages own the main content; releases preserve the approved shell.
 */
add_action('template_redirect', function () {
    if (is_admin()) return;
    // Preserve links from the retired WordPress menus and older messages.
    if (isset($_GET['page_id']) && is_scalar($_GET['page_id'])) {
        $id = absint($_GET['page_id']);
        $legacy_pages = [
            3 => '/privacidade/', 6 => '/',
            171 => '/restaurantes/jardins/', 241 => '/restaurantes/iguatemi/',
            257 => '/eventos/', 274 => '/reservas/',
            276 => '/reservas/jardins/', 285 => '/reservas/iguatemi/',
            308 => '/sac/', 310 => '/sac/', 322 => '/sac/',
            370 => '/eventos/', 372 => '/eventos/',
            388 => '/compliance/', 541 => '/rodeio-em-casa/', 578 => '/historia/',
        ];
        $target = $legacy_pages[$id] ?? null;
        if ($target === null && get_post_status($id) === 'publish') {
            $managed = get_post_meta($id, '_rodeio_managed_route', true);
            if ($managed !== '') $target = $managed === '/' ? '/' : trailingslashit($managed);
        }
        if ($target !== null) {
            wp_safe_redirect(home_url($target), 301);
            exit;
        }
        // Let WordPress return 404 for retired temporary pages and unknown IDs.
        return;
    }
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $route = trim(rawurldecode($path ?: '/'), '/');
    if ($route === 'rodeio-sitemap.xml') {
        wp_safe_redirect(home_url('/page-sitemap.xml'), 301);
        exit;
    }
    $redirects = [
        'jardins' => '/restaurantes/jardins/', 'iguatemi' => '/restaurantes/iguatemi/',
        'pagina-inicial' => '/', 'inicio' => '/',
        'politica-de-privacidade' => '/privacidade/',
        'sac/jardins' => '/sac/', 'sac/iguatemi' => '/sac/',
        'eventos/jardins' => '/eventos/', 'eventos/iguatemi' => '/eventos/',
    ];
    if (isset($redirects[$route])) {
        wp_safe_redirect(home_url($redirects[$route]), 301);
        exit;
    }
    $routes = [
    '' => 'home.html.gz',
    'historia' => 'historia.html.gz',
    'cardapio' => 'cardapio.html.gz',
    'cardapio/completo' => 'cardapio--completo.html.gz',
    'eventos' => 'eventos.html.gz',
    'eventos/orcamento' => 'eventos--orcamento.html.gz',
    'reservas' => 'reservas.html.gz',
    'reservas/jardins' => 'reservas--jardins.html.gz',
    'reservas/iguatemi' => 'reservas--iguatemi.html.gz',
    'restaurantes' => 'restaurantes.html.gz',
    'restaurantes/jardins' => 'restaurantes--jardins.html.gz',
    'restaurantes/iguatemi' => 'restaurantes--iguatemi.html.gz',
    'privacidade' => 'privacidade.html.gz',
    'sac' => 'sac.html.gz',
    'compliance' => 'compliance.html.gz',
    'rodeio-em-casa' => 'rodeio-em-casa.html.gz',
    'em-breve' => 'em-breve.html.gz',
    ];
    if (!array_key_exists($route, $routes)) return;
    $file = get_stylesheet_directory() . '/releases/__RELEASE__/pages/' . $routes[$route];
    if (!is_file($file)) return;
    $html = gzdecode(file_get_contents($file));
    if ($html === false) return;
    $page = $route === '' ? get_post((int) get_option('page_on_front')) : get_page_by_path($route);
    if ($page && $page->post_status === 'publish' &&
        get_post_meta($page->ID, '_rodeio_managed_route', true) === '/' . $route) {
        $content = do_blocks($page->post_content);
        $html = preg_replace_callback('/(<main\b[^>]*>)(.*?)(<\/main>)/s',
            static function ($match) use ($content) { return $match[1] . $content . $match[3]; }, $html, 1);
    }
    status_header(200);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: public, max-age=300');
    echo $html;
    exit;
}, 0);

// Publish only the native page sitemap; temporary/archived pages remain drafts.
add_filter('wpseo_sitemap_exclude_post_type', static function ($excluded, $type) {
    return $type === 'page' ? false : true;
}, 10, 2);
add_action('save_post_page', static function ($id) {
    if (get_post_meta($id, '_rodeio_managed_route', true) !== '' && function_exists('w3tc_flush_all')) w3tc_flush_all();
});

function rodeio_2026_form_guard($request) {
    if ($request->get_header('origin') !== untrailingslashit(home_url())) {
        return new WP_REST_Response(['success' => false, 'message' => 'Origem não permitida.'], 403);
    }
    if (strpos(strtolower($request->get_header('content-type')), 'application/x-www-form-urlencoded') !== 0) {
        return new WP_REST_Response(['success' => false, 'message' => 'Formato inválido.'], 415);
    }
    if (strlen($request->get_body()) > 8192) {
        return new WP_REST_Response(['success' => false, 'message' => 'Solicitação muito longa.'], 413);
    }
    foreach ($request->get_body_params() as $value) {
        if (!is_string($value)) return new WP_REST_Response(['success' => false, 'message' => 'Formato inválido.'], 400);
    }
    return null;
}

function rodeio_2026_form_rate_limit() {
    // Only the web server's client address is trusted; forwarded headers are spoofable.
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!filter_var($ip, FILTER_VALIDATE_IP)) return false;
    $key = 'rodeio_form_' . substr(hash_hmac('sha256', $ip, wp_salt('nonce')), 0, 32);
    $now = time();
    $state = get_transient($key);
    if (!is_array($state) || ($state['until'] ?? 0) <= $now) $state = ['count' => 0, 'until' => $now + 300];
    if ($state['count'] >= 6) return true;
    $state['count']++;
    set_transient($key, $state, max(1, $state['until'] - $now));
    return false;
}

add_action('rest_api_init', function () {
    register_rest_route('rodeio/v1', '/eventos', [
        'methods' => 'POST',
        'callback' => 'rodeio_2026_eventos',
        'permission_callback' => '__return_true',
    ]);
});

function rodeio_2026_eventos($request) {
    if ($failure = rodeio_2026_form_guard($request)) return $failure;
    $fields = $request->get_body_params();
    if (!empty($fields['website'])) {
        return new WP_REST_Response(['success' => false, 'message' => 'Não foi possível enviar.'], 400);
    }
    $name = trim((string) ($fields['name'] ?? ''));
    $email = trim((string) ($fields['email'] ?? ''));
    $phone = (string) ($fields['phone'] ?? '');
    $company = (string) ($fields['company'] ?? '');
    $unit = (string) ($fields['unit'] ?? '');
    $message = (string) ($fields['message'] ?? '');
    if (!$name || mb_strlen($name) > 120 || !is_email($email) || mb_strlen($email) > 180 ||
        !in_array($unit, ['jardins', 'iguatemi'], true) || mb_strlen($phone) > 40 ||
        mb_strlen($company) > 120 || mb_strlen($message) > 180) {
        return new WP_REST_Response(['success' => false, 'message' => 'Confira os campos antes de enviar.'], 400);
    }
    if (rodeio_2026_form_rate_limit()) return new WP_REST_Response(['success' => false, 'message' => 'Aguarde alguns minutos antes de tentar novamente.'], 429);
    $ajax = admin_url('admin-ajax.php');
    $nonce_response = wp_remote_post($ajax, [
        'timeout' => 8,
        'body' => ['action' => 'forminator_get_nonce', 'form_id' => '364'],
    ]);
    if (is_wp_error($nonce_response)) {
        return new WP_REST_Response(['success' => false, 'message' => 'Não foi possível confirmar o envio. Ligue (11) 3474-1333.'], 502);
    }
    $nonce_data = json_decode(wp_remote_retrieve_body($nonce_response), true);
    $nonce = $nonce_data['data'] ?? null;
    if (empty($nonce_data['success']) || !is_string($nonce) || !$nonce) {
        return new WP_REST_Response(['success' => false, 'message' => 'Não foi possível confirmar o envio. Ligue (11) 3474-1333.'], 502);
    }
    $response = wp_remote_post($ajax, [
        'timeout' => 12,
        'body' => [
            'name-1' => $name, 'email-1' => $email, 'phone-1' => $phone,
            'text-1' => $company, 'select-1' => $unit === 'jardins' ? 'one' : 'two',
            'textarea-1' => $message, 'forminator_nonce' => $nonce,
            'form_id' => '364', 'page_id' => '805', 'form_type' => 'default',
            'render_id' => '0', 'action' => 'forminator_submit_form_custom-forms',
            '_wp_http_referer' => '/eventos/',
            'current_url' => home_url('/eventos/'),
            'referer_url' => home_url('/eventos/'),
        ],
    ]);
    if (is_wp_error($response)) {
        return new WP_REST_Response(['success' => false, 'message' => 'Não foi possível confirmar o envio. Ligue (11) 3474-1333.'], 502);
    }
    $result = json_decode(wp_remote_retrieve_body($response), true);
    if (empty($result['success']) || empty($result['data']['success'])) {
        return new WP_REST_Response(['success' => false, 'message' => 'Não foi possível confirmar o envio. Ligue (11) 3474-1333.'], 502);
    }
    return new WP_REST_Response(['success' => true, 'message' => 'Solicitação enviada.']);
}

// The approved SAC and Compliance forms keep their existing Forminator IDs.
add_action('rest_api_init', function () {
    register_rest_route('rodeio/v1', '/contato', [
        'methods' => 'POST',
        'callback' => 'rodeio_2026_contato',
        'permission_callback' => '__return_true',
    ]);
});

function rodeio_2026_contato($request) {
    $reply = function ($success, $message, $status = 200) {
        $response = new WP_REST_Response(['success' => $success, 'message' => $message], $status);
        $response->header('Cache-Control', 'no-store');
        return $response;
    };
    if ($failure = rodeio_2026_form_guard($request)) return $failure;
    $fields = $request->get_body_params();
    if (!empty($fields['website'])) return $reply(false, 'Não foi possível enviar.', 400);
    $forms = [
        'sac-jardins' => ['id' => '363', 'page' => '826', 'path' => '/sac/'],
        'sac-iguatemi' => ['id' => '318', 'page' => '826', 'path' => '/sac/'],
        'compliance' => ['id' => '393', 'page' => '827', 'path' => '/compliance/'],
    ];
    $kind = isset($fields['kind']) && is_string($fields['kind']) ? $fields['kind'] : '';
    if (!isset($forms[$kind])) return $reply(false, 'Formulário inválido.', 400);
    $form = $forms[$kind];
    foreach (['message', 'name', 'email', 'phone', 'subject'] as $key) {
        if (isset($fields[$key]) && !is_string($fields[$key])) return $reply(false, 'Formato inválido.', 400);
    }
    $message = trim($fields['message'] ?? '');
    if (!$message || mb_strlen($message) > 180) return $reply(false, 'Escreva uma mensagem de até 180 caracteres.', 400);
    $payload = [
        'textarea-1' => $message, 'form_id' => $form['id'], 'page_id' => $form['page'],
        'form_type' => 'default', 'render_id' => '0',
        'action' => 'forminator_submit_form_custom-forms', '_wp_http_referer' => $form['path'],
        'current_url' => home_url($form['path']), 'referer_url' => home_url($form['path']),
    ];
    if ($kind !== 'compliance') {
        $name = trim($fields['name'] ?? '');
        $email = trim($fields['email'] ?? '');
        $phone = trim($fields['phone'] ?? '');
        $subject = trim($fields['subject'] ?? '');
        if (!$name || mb_strlen($name) > 120 || !is_email($email) || mb_strlen($email) > 180 || mb_strlen($phone) > 40 || mb_strlen($subject) > 120) {
            return $reply(false, 'Confira nome, e-mail e demais campos.', 400);
        }
        $payload += ['name-1' => $name, 'email-1' => $email, 'phone-1' => $phone, 'text-1' => $subject];
    }
    if (rodeio_2026_form_rate_limit()) return $reply(false, 'Aguarde alguns minutos antes de tentar novamente.', 429);
    $failure = 'Não foi possível confirmar o envio. Entre em contato pelo telefone (11) 3474-1333.';
    $nonce_response = wp_remote_post(admin_url('admin-ajax.php'), [
        'timeout' => 8, 'body' => ['action' => 'forminator_get_nonce', 'form_id' => $form['id']],
    ]);
    if (is_wp_error($nonce_response) || wp_remote_retrieve_response_code($nonce_response) !== 200) return $reply(false, $failure, 502);
    $nonce = json_decode(wp_remote_retrieve_body($nonce_response), true);
    if (empty($nonce['success']) || !isset($nonce['data']) || !is_string($nonce['data']) || !$nonce['data']) return $reply(false, $failure, 502);
    $payload['forminator_nonce'] = $nonce['data'];
    $response = wp_remote_post(admin_url('admin-ajax.php'), ['timeout' => 12, 'body' => $payload]);
    if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) return $reply(false, $failure, 502);
    $result = json_decode(wp_remote_retrieve_body($response), true);
    if (empty($result['success']) || empty($result['data']['success'])) return $reply(false, $failure, 502);
    return $reply(true, 'Mensagem enviada.');
}
