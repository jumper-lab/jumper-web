<?php
/** Mapped content editing without replacing the approved layout or its controls. */
class Rodeio_Editor_Document
{
    public $dom;
    public $root;
    public $xpath;
    public function __construct($html)
    {
        $this->dom = new DOMDocument("1.0", "UTF-8");
        $previous = libxml_use_internal_errors(true);
        $ok = $this->dom->loadHTML(
            '<?xml encoding="UTF-8"><div id="rodeio-editor-root">' . $html . "</div>",
            LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $this->root = $this->dom->getElementById("rodeio-editor-root");
        if (!$ok || !$this->root) {
            throw new RuntimeException("Não foi possível ler o HTML para edição.");
        }
        $this->xpath = new DOMXPath($this->dom);
    }
    public function html()
    {
        $out = "";
        foreach ($this->root->childNodes as $node) {
            $out .= $this->dom->saveHTML($node);
        }
        return $out;
    }
    public function node($path)
    {
        $nodes = $this->xpath->query($path);
        return $nodes && $nodes->length === 1 ? $nodes->item(0) : null;
    }
    public function ancestor($node, $test)
    {
        for ($p = $node->parentNode; $p && $p !== $this->root; $p = $p->parentNode) {
            if ($p instanceof DOMElement && $test($p)) {
                return $p;
            }
        }
        return null;
    }
    private function text_nodes($node)
    {
        $out = [];
        foreach ($this->xpath->query(".//text()", $node) as $text) {
            if (trim($text->nodeValue) === "") {
                continue;
            }
            if (
                $this->ancestor($text, static function ($p) {
                    return in_array(
                        $p->tagName,
                        ["svg", "script", "style", "select", "textarea", "noscript"],
                        true,
                    ) ||
                        $p->getAttribute("aria-hidden") === "true" ||
                        $p->getAttribute("role") === "status";
                })
            ) {
                continue;
            }
            $out[] = $text;
        }
        return $out;
    }
    private function label($node, $fallback = "")
    {
        $text = $node instanceof DOMText ? $node->nodeValue : $node->textContent;
        $text = trim(preg_replace("/\s+/u", " ", $text));
        if ($text === "") {
            $text = $fallback;
        }
        return function_exists("mb_substr") ? mb_substr($text, 0, 100) : substr($text, 0, 100);
    }
    private function simple_nav($node)
    {
        if (!$node || $node->tagName !== "nav") {
            return false;
        }
        $links = $node->getElementsByTagName("a");
        if (!$links->length) {
            return false;
        }
        foreach ($links as $link) {
            if ($link->parentNode !== $node) {
                return false;
            }
        }
        return true;
    }
    public function capture()
    {
        $out = ["texts" => [], "images" => [], "links" => [], "menus" => []];
        $settings = $this->xpath->query(".//*[@data-rde-setting]", $this->root)->length > 0;
        foreach ($this->text_nodes($this->root) as $text) {
            if (
                $settings &&
                !$this->ancestor($text, static function ($p) {
                    return $p->hasAttribute("data-rde-setting") && $p->tagName !== "a";
                })
            ) {
                continue;
            }
            if (
                $this->ancestor($text, function ($p) {
                    return $this->simple_nav($p);
                })
            ) {
                continue;
            }
            if (
                !$this->ancestor($text, static function ($p) {
                    return in_array(
                        $p->tagName,
                        [
                            "h1",
                            "h2",
                            "h3",
                            "h4",
                            "h5",
                            "h6",
                            "p",
                            "figcaption",
                            "address",
                            "a",
                            "span",
                            "strong",
                            "em",
                            "button",
                            "label",
                            "dt",
                            "dd",
                        ],
                        true,
                    );
                })
            ) {
                continue;
            }
            $context = $this->ancestor($text, static function ($p) {
                return in_array(
                    $p->tagName,
                    ["h1", "h2", "h3", "h4", "p", "figcaption", "address", "a", "button", "label"],
                    true,
                );
            });
            $names = [
                "h1" => "Título principal",
                "h2" => "Título de seção",
                "h3" => "Subtítulo",
                "p" => "Parágrafo",
                "address" => "Endereço",
                "a" => "Texto do link",
                "button" => "Texto do botão",
                "figcaption" => "Legenda",
            ];
            $out["texts"][] = [
                "key" => $text->getNodePath(),
                "context" =>
                    ($names[$context ? $context->tagName : ""] ?? "Texto") .
                    " · " .
                    $this->label($text),
                "value" => trim($text->nodeValue),
            ];
        }
        foreach ($this->xpath->query(".//img", $this->root) as $img) {
            $url = $img->getAttribute("src") ?: $img->getAttribute("data-src");
            if (!$url) {
                continue;
            }
            // PDF raster pages are maintained together with their PDF, never as unrelated photographs.
            if (strpos($url, "/cardapio-paginas/") !== false) {
                continue;
            }
            $slide = $this->ancestor($img, static function ($p) {
                return $p->hasAttribute("data-hero-slide");
            });
            $brand = $this->ancestor($img, static function ($p) {
                return preg_match(
                    "/(?:header-brand|menu-brand|footer-brand)/",
                    $p->getAttribute("class"),
                );
            });
            $context =
                $this->label(
                    $img,
                    $slide
                        ? "Banner · " . $slide->getAttribute("data-caption")
                        : $img->getAttribute("alt"),
                ) ?:
                "Imagem";
            if ($brand) {
                $class = $brand->getAttribute("class");
                $context =
                    strpos($class, "header-brand") !== false
                        ? "Logotipo do cabeçalho"
                        : (strpos($class, "menu-brand") !== false
                            ? "Logotipo do menu · fundo escuro"
                            : "Logotipo do rodapé · fundo escuro");
            }
            $out["images"][] = [
                "key" => $img->getNodePath(),
                "context" => $context,
                "url" => $url,
                "pick" => (int) $img->getAttribute("data-rde-image-id"),
                "mobile" => (int) $img->getAttribute("data-rde-mobile-id"),
                "alt" => $img->getAttribute("alt"),
                "kind" => $this->ancestor($img, static function ($p) {
                    return $p->tagName === "picture";
                })
                    ? "picture"
                    : "image",
            ];
        }
        foreach ($this->xpath->query(".//*[@href or @data-menu-url or @src]", $this->root) as $el) {
            if (
                $this->ancestor($el, function ($p) {
                    return $this->simple_nav($p);
                }) ||
                $el->hasAttribute("data-gallery")
            ) {
                continue;
            }
            $attrs =
                $el->tagName === "a"
                    ? ["href"]
                    : ($el->tagName === "iframe"
                        ? ["src"]
                        : ($el->hasAttribute("data-menu-url")
                            ? ["data-menu-url"]
                            : []));
            foreach ($attrs as $attr) {
                $value = $el->getAttribute($attr);
                if (!$value || preg_match('~\.pdf(?:[?#]|$)~i', $value)) {
                    continue;
                }
                $out["links"][] = [
                    "key" => $el->getNodePath() . "@" . $attr,
                    "context" =>
                        $this->label(
                            $el,
                            $el->getAttribute("data-page-label") ?: $el->getAttribute("title"),
                        ) ?:
                        "Endereço do conteúdo",
                    "url" => $value,
                ];
            }
        }
        foreach ($this->xpath->query(".//nav", $this->root) as $nav) {
            if (!$this->simple_nav($nav)) {
                continue;
            }
            $items = [];
            foreach ($nav->getElementsByTagName("a") as $a) {
                $label = "";
                foreach ($this->text_nodes($a) as $t) {
                    $label .= $t->nodeValue;
                }
                $items[] = [
                    "key" => $a->getNodePath(),
                    "label" => trim($label),
                    "url" => $a->getAttribute("href"),
                    "new_tab" => $a->getAttribute("target") === "_blank" ? 1 : 0,
                ];
            }
            $out["menus"][] = [
                "key" => $nav->getNodePath(),
                "context" => $nav->getAttribute("aria-label") ?: "Navegação",
                "items" => $items,
            ];
        }
        return $out;
    }
    public static function url($value, $attribute = "href")
    {
        $value = trim((string) $value);
        if (
            $value === "" ||
            preg_match('/[\x00-\x20<>"\x27]/', $value) ||
            strpos($value, "//") === 0
        ) {
            throw new RuntimeException("Informe um endereço válido, sem espaços.");
        }
        if ($value[0] === "/" || ($attribute === "href" && $value[0] === "#")) {
            return $value;
        }
        $protocols = $attribute === "href" ? ["http", "https", "mailto", "tel"] : ["https", "http"];
        $scheme = strtolower(parse_url($value, PHP_URL_SCHEME) ?: "");
        if (!in_array($scheme, $protocols, true) || esc_url_raw($value, $protocols) === "") {
            throw new RuntimeException("Use um link HTTP(S), telefone, e-mail ou caminho interno.");
        }
        return esc_url_raw($value, $protocols);
    }
    public static function semantic($row, $kind)
    {
        $keys = [
            "texts" => ["value"],
            "images" => ["url", "pick", "mobile", "alt"],
            "links" => ["url"],
            "menus" => ["items"],
        ][$kind];
        return array_intersect_key($row, array_flip($keys));
    }
    public static function changed($base, $desired)
    {
        $changes = [];
        foreach (["texts", "images", "links", "menus"] as $kind) {
            $known = [];
            foreach ($base[$kind] ?? [] as $row) {
                $known[$row["key"]] = $row;
            }
            foreach ($desired[$kind] ?? [] as $row) {
                if (!isset($known[$row["key"]])) {
                    throw new RuntimeException(
                        "O HTML mudou. Recarregue o editor antes de salvar os campos.",
                    );
                }
                if (self::semantic($known[$row["key"]], $kind) !== self::semantic($row, $kind)) {
                    $changes[] = [$kind, $known[$row["key"]], $row];
                }
            }
        }
        return $changes;
    }
    public function merge($base, $desired)
    {
        $current = $this->capture();
        $changes = self::changed($base, $desired);
        $index = [];
        foreach ($current as $kind => $rows) {
            foreach ($rows as $row) {
                $index[$kind][$row["key"]] = $row;
            };
        }
        foreach ($changes as [$kind, $old, $new]) {
            $now = $index[$kind][$old["key"]] ?? null;
            if (
                !$now ||
                (self::semantic($now, $kind) !== self::semantic($old, $kind) &&
                    self::semantic($now, $kind) !== self::semantic($new, $kind))
            ) {
                throw new RuntimeException(
                    "O mesmo conteúdo foi alterado no HTML e nos campos. Recarregue e revise: " .
                        $old["context"],
                );
            }
        }
        foreach ($changes as [$kind, $old, $new]) {
            if ($kind === "texts") {
                $text = $this->node($old["key"]);
                if (trim((string) $new["value"]) === "") {
                    throw new RuntimeException("Preencha o texto ou remova o elemento pelo HTML.");
                }
                preg_match("/^\s*/u", $text->nodeValue, $left);
                preg_match('/\s*$/u', $text->nodeValue, $right);
                $text->nodeValue = $left[0] . (string) $new["value"] . $right[0];
            } elseif ($kind === "links") {
                $at = strrpos($old["key"], "@");
                $path = substr($old["key"], 0, $at);
                $attr = substr($old["key"], $at + 1);
                $this->node($path)->setAttribute($attr, self::url($new["url"], $attr));
            } elseif ($kind === "images") {
                $this->image($old, $new);
            } elseif ($kind === "menus") {
                $this->menu($old, $new);
            }
        }
        return $changes ? $this->html() : null;
    }
    private function image($old, $new)
    {
        $img = $this->node($old["key"]);
        $img->setAttribute("alt", (string) $new["alt"]);
        $changed =
            $old["url"] !== $new["url"] ||
            (int) $old["pick"] !== (int) $new["pick"] ||
            (int) $old["mobile"] !== (int) $new["mobile"];
        if (!$changed) {
            return;
        }
        $id = (int) $new["pick"];
        if ($old["url"] !== $new["url"] && (int) $old["pick"] === $id) {
            $id = 0;
        }
        if ($id && !wp_attachment_is_image($id)) {
            throw new RuntimeException("Selecione uma imagem válida na Biblioteca de mídia.");
        }
        $url = $id ? wp_get_attachment_image_url($id, "full") : self::url($new["url"], "src");
        $srcset = $id ? (wp_get_attachment_image_srcset($id, "full") ?: $url) : $url;
        $deferred = $img->hasAttribute("data-src");
        foreach (["src", "srcset", "data-src", "data-srcset"] as $attr) {
            $img->removeAttribute($attr);
        }
        $img->setAttribute($deferred ? "data-src" : "src", $url);
        $img->setAttribute($deferred ? "data-srcset" : "srcset", $srcset);
        $img->setAttribute("data-rde-image-id", (string) $id);
        $img->setAttribute("data-rde-mobile-id", (string) (int) $new["mobile"]);
        $img->setAttribute("data-rde-image-changed", "1");
        if ($id) {
            $meta = wp_get_attachment_metadata($id);
            if (!empty($meta["width"]) && !empty($meta["height"])) {
                $img->setAttribute("width", (string) $meta["width"]);
                $img->setAttribute("height", (string) $meta["height"]);
            }
        }
        $picture = $this->ancestor($img, static function ($p) {
            return $p->tagName === "picture";
        });
        if ($picture) {
            foreach ($picture->getElementsByTagName("source") as $source) {
                $mobile = (int) $new["mobile"];
                if ($mobile && !wp_attachment_is_image($mobile)) {
                    throw new RuntimeException("A imagem mobile selecionada é inválida.");
                }
                $for_mobile =
                    $mobile && strpos($source->getAttribute("media"), "portrait") !== false;
                $asset = $for_mobile ? $mobile : $id;
                $set = $for_mobile
                    ? (wp_get_attachment_image_srcset($mobile, "full") ?:
                    wp_get_attachment_url($mobile))
                    : $srcset;
                $attribute = $source->hasAttribute("data-srcset") ? "data-srcset" : "srcset";
                $source->removeAttribute("srcset");
                $source->removeAttribute("data-srcset");
                $source->setAttribute($attribute, $set);
                $mime = $asset ? get_post_mime_type($asset) : "";
                if ($mime) {
                    $source->setAttribute("type", $mime);
                } else {
                    $source->removeAttribute("type");
                }
            };
        }
        $preview = $this->ancestor($img, static function ($p) {
            return strpos($p->getAttribute("style"), "background-image:") !== false;
        });
        if ($preview) {
            $preview->setAttribute(
                "style",
                preg_replace(
                    "~background-image\s*:\s*url\(.*?\);?~",
                    "background-image:none;",
                    $preview->getAttribute("style"),
                ),
            );
        }
        $gallery = $this->ancestor($img, static function ($p) {
            return $p->tagName === "a" && $p->hasAttribute("data-gallery");
        });
        if ($gallery) {
            $gallery->setAttribute("href", $url);
        }
    }
    private function menu($old, $new)
    {
        $nav = $this->node($old["key"]);
        $links = [];
        foreach ($nav->getElementsByTagName("a") as $a) {
            $links[$a->getNodePath()] = $a;
        }
        $template = reset($links);
        if (!$template) {
            throw new RuntimeException("Menu sem modelo.");
        }
        if (count($new["items"]) > 12) {
            throw new RuntimeException("Use até 12 itens por menu.");
        }
        $items = [];
        $used = [];
        foreach ($new["items"] as $row) {
            $key = $row["key"] ?? "";
            if ($key !== "" && (!isset($links[$key]) || isset($used[$key]))) {
                throw new RuntimeException("Item de menu inválido. Recarregue o editor.");
            }
            $used[$key] = true;
            $a = ($links[$key] ?? $template)->cloneNode(true);
            $a->removeAttribute("id");
            $a->removeAttribute("aria-current");
            $destination = self::url($row["url"]);
            if (
                $key !== "" &&
                preg_match('~\.pdf(?:[?#]|$)~i', $links[$key]->getAttribute("href")) &&
                preg_match('~\.pdf(?:[?#]|$)~i', $destination) &&
                $destination !== $links[$key]->getAttribute("href")
            ) {
                throw new RuntimeException(
                    "A troca do PDF exige atualizar também suas páginas. Use o fluxo próprio do cardápio.",
                );
            }
            $a->setAttribute("href", $destination);
            $text = $this->text_nodes($a);
            if (!$text) {
                throw new RuntimeException("Item sem rótulo.");
            }
            $text[0]->nodeValue = (string) $row["label"];
            foreach (array_slice($text, 1) as $t) {
                $t->nodeValue = "";
            }
            if (!empty($row["new_tab"])) {
                $a->setAttribute("target", "_blank");
                $a->setAttribute("rel", "noopener noreferrer");
            } else {
                $a->removeAttribute("target");
                $a->removeAttribute("rel");
            }
            $items[] = $a;
        }
        foreach ($links as $a) {
            $nav->removeChild($a);
        }
        foreach ($items as $a) {
            $nav->appendChild($a);
        }
    }
}
