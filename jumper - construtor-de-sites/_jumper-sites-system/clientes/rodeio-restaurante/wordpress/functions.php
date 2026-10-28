<?php
/**
 * Rodeio's approved Astro output is the source of truth for the public pages.
 * The existing WordPress installation, plugins and database are left intact.
 */
add_action('template_redirect', function () {
    if (is_admin()) return;
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $route = trim(rawurldecode($path ?: '/'), '/');
    if ($route === 'rodeio-sitemap.xml') {
        $pages = [
        '',
        'historia',
        'cardapio',
        'cardapio/completo',
        'eventos',
        'eventos/orcamento',
        'reservas',
        'reservas/jardins',
        'reservas/iguatemi',
        'restaurantes',
        'restaurantes/jardins',
        'restaurantes/iguatemi',
        'privacidade',
        'sac',
        'compliance',
        'rodeio-em-casa',
        ];
        status_header(200);
        header('Content-Type: application/xml; charset=UTF-8');
        echo '<?xml version="1.0" encoding="UTF-8"?>';
        echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach ($pages as $page) {
            echo '<url><loc>' . esc_xml(home_url($page === '' ? '/' : '/' . $page . '/')) . '</loc></url>';
        }
        echo '</urlset>';
        exit;
    }
    if ($route === 'jardins' || $route === 'iguatemi') {
        wp_safe_redirect(home_url('/restaurantes/' . $route . '/'), 301);
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
    status_header(200);
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: public, max-age=300');
    echo $html;
    exit;
}, 0);

add_filter('wpseo_sitemap_index', function ($sitemap) {
    return $sitemap . '<sitemap><loc>' . esc_xml(home_url('/rodeio-sitemap.xml')) . '</loc></sitemap>';
});

add_action('rest_api_init', function () {
    register_rest_route('rodeio/v1', '/eventos', [
        'methods' => 'POST',
        'callback' => 'rodeio_2026_eventos',
        'permission_callback' => '__return_true',
    ]);
});

function rodeio_2026_eventos($request) {
    $origin = $request->get_header('origin');
    if ($origin && $origin !== untrailingslashit(home_url())) {
        return new WP_REST_Response(['success' => false, 'message' => 'Origem não permitida.'], 403);
    }
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
            'form_id' => '364', 'page_id' => '257', 'form_type' => 'default',
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
    if ($request->get_header('origin') !== untrailingslashit(home_url())) {
        return $reply(false, 'Origem não permitida.', 403);
    }
    if (strpos(strtolower($request->get_header('content-type')), 'application/x-www-form-urlencoded') !== 0) {
        return $reply(false, 'Formato inválido.', 415);
    }
    if (strlen($request->get_body()) > 8192) {
        return $reply(false, 'Solicitação muito longa.', 413);
    }
    $fields = $request->get_body_params();
    if (!empty($fields['website'])) return $reply(false, 'Não foi possível enviar.', 400);
    $forms = [
        'sac-jardins' => ['id' => '363', 'page' => '310', 'path' => '/sac/jardins/'],
        'sac-iguatemi' => ['id' => '318', 'page' => '322', 'path' => '/sac/iguatemi/'],
        'compliance' => ['id' => '393', 'page' => '388', 'path' => '/compliance/'],
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
