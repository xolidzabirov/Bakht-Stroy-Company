<?php

declare(strict_types=1);

namespace App\Shared\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/**
 * Cleans HTML from a rich text editor before it is stored:
 * keeps formatting (headings, lists, links, images, tables, quotes),
 * removes scripts, event handlers, iframes, styles and javascript: links (XSS).
 */
final class SafeHtml
{
    public const MAX_LENGTH = 200_000;

    private static ?HtmlSanitizer $sanitizer = null;

    public static function clean(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        return trim(self::sanitizer()->sanitize($html));
    }

    /**
     * Plain text of the HTML (for excerpts, search and reading time).
     */
    public static function toText(string $html): string
    {
        $text = html_entity_decode(strip_tags(str_replace(['</p>', '<br>', '<br />', '</li>', '</h2>', '</h3>'], ' ', $html)), ENT_QUOTES | ENT_HTML5);

        return trim((string) preg_replace('/\s+/u', ' ', $text));
    }

    private static function sanitizer(): HtmlSanitizer
    {
        return self::$sanitizer ??= new HtmlSanitizer(
            (new HtmlSanitizerConfig)
                ->allowSafeElements()
                ->dropElement('style')
                ->dropAttribute('style', '*')
                ->allowLinkSchemes(['https', 'http', 'mailto', 'tel'])
                ->allowRelativeLinks()
                ->allowMediaSchemes(['https', 'http'])
                ->allowRelativeMedias()
                ->forceAttribute('a', 'rel', 'noopener noreferrer nofollow')
                ->withMaxInputLength(self::MAX_LENGTH),
        );
    }
}
