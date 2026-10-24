<?php

declare(strict_types=1);

namespace Database\Seeders\Support;

use GdImage;
use RuntimeException;

/**
 * Generates clean demo pictures for products, categories, news and banners with GD:
 * brand gradient, a simple material pictogram, the title and a spec line.
 * Real photos can replace them later in the admin panel.
 */
final class DemoImage
{
    public const ICONS = ['bag', 'bricks', 'blocks', 'rebar', 'pipe', 'roof', 'roll', 'sheet', 'tool', 'drill', 'bucket', 'sand'];

    private const FONT = __DIR__.'/../assets/fonts/Inter.ttf';

    /**
     * Square product card, 1200×1200 PNG. Returns a temp file path.
     *
     * @param  array{0: string, 1: string}  $palette  two hex colors for the gradient
     */
    public static function product(string $title, string $subtitle, string $icon, array $palette): string
    {
        $size = 1200;
        $img = self::canvas($size, $size, $palette);

        self::pattern($img, $size, $size);
        self::icon($img, $icon, (int) ($size / 2), 430, 300);
        self::brand($img, 60, 90, 30);

        // White info panel.
        $panelTop = 780;
        self::roundedRect($img, 50, $panelTop, $size - 50, $size - 50, 40, self::color($img, '#FFFFFF'));
        $lines = self::wrap($title, 52, $size - 180, 2);
        $y = $panelTop + 95;
        foreach ($lines as $line) {
            self::text($img, $line, 52, 100, $y, '#1F2328', bold: true);
            $y += 70;
        }
        self::text($img, self::fit($subtitle, 34, $size - 180), 34, 100, $y + 15, '#5B6470');

        return self::save($img);
    }

    /**
     * Category picture, 800×800 PNG.
     *
     * @param  array{0: string, 1: string}  $palette
     */
    public static function category(string $title, string $icon, array $palette): string
    {
        $size = 800;
        $img = self::canvas($size, $size, $palette);

        self::pattern($img, $size, $size);
        self::icon($img, $icon, (int) ($size / 2), 330, 230);
        self::brand($img, 45, 70, 22);

        $lines = self::wrap($title, 54, $size - 100, 2);
        $y = 640 - (count($lines) - 1) * 35;
        foreach ($lines as $line) {
            self::text($img, $line, 54, self::centerX($line, 54, $size, true), $y, '#FFFFFF', bold: true);
            $y += 72;
        }

        return self::save($img);
    }

    /**
     * Wide picture for news covers (1600×1000) and banners (1920×600).
     *
     * @param  array{0: string, 1: string}  $palette
     */
    public static function wide(string $title, string $subtitle, string $icon, array $palette, int $width = 1600, int $height = 1000): string
    {
        $img = self::canvas($width, $height, $palette);

        self::pattern($img, $width, $height);
        self::icon($img, $icon, (int) ($width * 0.78), (int) ($height / 2), (int) ($height * 0.55));
        self::brand($img, 80, 110, 30);

        $fontSize = (int) min(68, $height / 9);
        $lines = self::wrap($title, $fontSize, (int) ($width * 0.58), 3);
        $y = (int) ($height / 2) - (count($lines) - 1) * (int) ($fontSize * 0.7);
        foreach ($lines as $line) {
            self::text($img, $line, $fontSize, 80, $y, '#FFFFFF', bold: true);
            $y += (int) ($fontSize * 1.35);
        }
        self::text($img, self::fit($subtitle, (int) ($fontSize * 0.5), (int) ($width * 0.58)), (int) ($fontSize * 0.5), 80, $y + 10, '#FFE7D6');

        return self::save($img);
    }

    /**
     * @param  array{0: string, 1: string}  $palette
     */
    private static function canvas(int $width, int $height, array $palette): GdImage
    {
        $img = imagecreatetruecolor($width, $height);

        if ($img === false) {
            throw new RuntimeException('GD cannot create an image.');
        }

        imagealphablending($img, true);
        [$r1, $g1, $b1] = self::rgb($palette[0]);
        [$r2, $g2, $b2] = self::rgb($palette[1]);

        for ($y = 0; $y < $height; $y++) {
            $t = $y / max(1, $height - 1);
            $color = imagecolorallocate($img, (int) ($r1 + ($r2 - $r1) * $t), (int) ($g1 + ($g2 - $g1) * $t), (int) ($b1 + ($b2 - $b1) * $t));
            imageline($img, 0, $y, $width, $y, (int) $color);
        }

        return $img;
    }

    /**
     * Soft diagonal stripes for texture.
     */
    private static function pattern(GdImage $img, int $width, int $height): void
    {
        $stripe = self::color($img, '#FFFFFF', 122);
        imagesetthickness($img, 18);

        for ($x = -$height; $x < $width; $x += 90) {
            imageline($img, $x, $height, $x + $height, 0, $stripe);
        }

        imagesetthickness($img, 1);
    }

    private static function brand(GdImage $img, int $x, int $y, int $size): void
    {
        // White mark on orange backgrounds, orange on the others.
        [$r, $g] = self::rgb(sprintf('#%06X', imagecolorat($img, $x, $y) & 0xFFFFFF));
        $accent = $r > 200 && $g < 140 ? self::color($img, '#FFFFFF') : self::color($img, '#F26B1D');
        imagefilledrectangle($img, $x, $y - $size, $x + (int) ($size * 0.35), $y, $accent);
        self::text($img, 'BAKHT STROY', $size, $x + (int) ($size * 0.6), $y, '#FFFFFF', bold: true);
    }

    /**
     * Simple white pictograms of building materials.
     */
    private static function icon(GdImage $img, string $icon, int $cx, int $cy, int $s): void
    {
        // Opaque colors: overlapping parts of rounded shapes must not show through.
        $white = self::color($img, '#F8FAFC');
        $soft = self::color($img, '#CBD5E1');
        $line = self::color($img, '#1F2328', 90);
        $h = (int) ($s / 2);

        switch ($icon) {
            case 'bag': // cement bag
                self::roundedRect($img, $cx - $h, $cy - $h, $cx + $h, $cy + $h, (int) ($s * 0.12), $white);
                imagefilledrectangle($img, $cx - $h + 20, $cy - $h + 25, $cx + $h - 20, $cy - $h + 55, $soft);
                imagefilledrectangle($img, $cx - (int) ($h * 0.6), $cy - 10, $cx + (int) ($h * 0.6), $cy + (int) ($h * 0.45), self::color($img, '#F26B1D'));
                break;

            case 'bricks':
                $bw = (int) ($s * 0.42);
                $bh = (int) ($s * 0.2);
                for ($row = 0; $row < 4; $row++) {
                    $offset = $row % 2 ? (int) ($bw / 2) : 0;
                    for ($col = -1; $col < 3; $col++) {
                        $x1 = $cx - $h + $col * ($bw + 10) + $offset;
                        $y1 = $cy - $h + $row * ($bh + 10);
                        if ($x1 + $bw < $cx - $h || $x1 > $cx + $h) {
                            continue;
                        }
                        imagefilledrectangle($img, max($x1, $cx - $h), $y1, min($x1 + $bw, $cx + $h), $y1 + $bh, $white);
                    }
                }
                break;

            case 'blocks':
                for ($i = 0; $i < 3; $i++) {
                    $y1 = $cy + $h - ($i + 1) * (int) ($s * 0.3);
                    self::roundedRect($img, $cx - $h + $i * 15, $y1, $cx + $h - $i * 15, $y1 + (int) ($s * 0.27), 10, $white);
                }
                break;

            case 'rebar':
                imagesetthickness($img, (int) ($s * 0.06));
                for ($i = -3; $i <= 3; $i++) {
                    $tilt = intdiv($h, 3);
                    imageline($img, $cx - $h, $cy + $i * (int) ($s * 0.12) + $tilt, $cx + $h, $cy + $i * (int) ($s * 0.12) - $tilt, $white);
                }
                imagesetthickness($img, 1);
                break;

            case 'pipe':
                for ($i = 0; $i < 3; $i++) {
                    for ($j = 0; $j < 3 - $i; $j++) {
                        $x = $cx - $h + (int) ($s * 0.17) + $j * (int) ($s * 0.34) + $i * (int) ($s * 0.17);
                        $y = $cy + $h - (int) ($s * 0.17) - $i * (int) ($s * 0.3);
                        imagefilledellipse($img, $x, $y, (int) ($s * 0.3), (int) ($s * 0.3), $white);
                        imagefilledellipse($img, $x, $y, (int) ($s * 0.15), (int) ($s * 0.15), $soft);
                    }
                }
                break;

            case 'roof':
                $points = [$cx - $h - 30, $cy + 20, $cx, $cy - $h, $cx + $h + 30, $cy + 20];
                imagefilledpolygon($img, $points, $white);
                imagefilledrectangle($img, $cx - $h + 30, $cy + 20, $cx + $h - 30, $cy + $h, $soft);
                imagefilledrectangle($img, $cx - 40, $cy + $h - 120, $cx + 40, $cy + $h, $white);
                break;

            case 'roll':
                imagefilledellipse($img, $cx, $cy, $s, $s, $white);
                imagefilledellipse($img, $cx, $cy, (int) ($s * 0.55), (int) ($s * 0.55), $soft);
                imagefilledellipse($img, $cx, $cy, (int) ($s * 0.22), (int) ($s * 0.22), $white);
                break;

            case 'sheet':
                for ($i = 0; $i < 3; $i++) {
                    self::roundedRect($img, $cx - $h + $i * 30, $cy - $h + $i * 30, $cx + $h - 60 + $i * 30, $cy + $h - 60 + $i * 30, 12, $i === 2 ? $white : $soft);
                }
                break;

            case 'tool': // hammer
                self::roundedRect($img, $cx - $h, $cy - $h, $cx + (int) ($h * 0.6), $cy - (int) ($h * 0.45), 18, $white);
                imagefilledrectangle($img, $cx - (int) ($s * 0.07), $cy - (int) ($h * 0.45), $cx + (int) ($s * 0.07), $cy + $h, $white);
                break;

            case 'drill':
                self::roundedRect($img, $cx - $h, $cy - $h + 20, $cx + (int) ($h * 0.4), $cy - (int) ($h * 0.15), 30, $white);
                imagefilledrectangle($img, $cx + (int) ($h * 0.4), $cy - (int) ($h * 0.55), $cx + $h, $cy - (int) ($h * 0.45), $white);
                self::roundedRect($img, $cx - (int) ($h * 0.6), $cy - (int) ($h * 0.15), $cx - (int) ($h * 0.2), $cy + $h, 20, $white);
                imagefilledrectangle($img, $cx - (int) ($h * 0.75), $cy + (int) ($h * 0.7), $cx - (int) ($h * 0.05), $cy + $h, self::color($img, '#F26B1D'));
                break;

            case 'bucket':
                imagefilledpolygon($img, [$cx - $h, $cy - $h + 40, $cx + $h, $cy - $h + 40, $cx + $h - 50, $cy + $h, $cx - $h + 50, $cy + $h], $white);
                imagefilledrectangle($img, $cx - $h - 10, $cy - $h + 20, $cx + $h + 10, $cy - $h + 60, $soft);
                break;

            case 'sand':
            default:
                imagefilledpolygon($img, [$cx - $h - 40, $cy + $h, $cx - 20, $cy - $h + 30, $cx + 30, $cy - $h + 10, $cx + $h + 40, $cy + $h], $white);
                for ($i = 0; $i < 40; $i++) {
                    imagefilledellipse($img, $cx - $h + ($i * 37) % $s, $cy + (($i * 53) % $h), 14, 14, $soft);
                }
                break;
        }

        unset($line);
    }

    private static function text(GdImage $img, string $text, int $size, int $x, int $y, string $hex, bool $bold = false): void
    {
        $color = self::color($img, $hex);
        imagettftext($img, $size, 0, $x, $y, $color, self::FONT, $text);

        if ($bold) {
            // The variable font renders the regular weight: thicken it a little.
            imagettftext($img, $size, 0, $x + 1, $y, $color, self::FONT, $text);
            imagettftext($img, $size, 0, $x + 2, $y, $color, self::FONT, $text);
        }
    }

    private static function textWidth(string $text, int $size): int
    {
        $box = imagettfbbox($size, 0, self::FONT, $text);

        return $box === false ? 0 : (int) abs($box[2] - $box[0]) + 2;
    }

    private static function centerX(string $text, int $size, int $width, bool $bold = false): int
    {
        return (int) (($width - self::textWidth($text, $size) - ($bold ? 2 : 0)) / 2);
    }

    /**
     * @return list<string>
     */
    private static function wrap(string $text, int $size, int $maxWidth, int $maxLines): array
    {
        $lines = [];
        $current = '';

        foreach (preg_split('/\s+/u', trim($text)) ?: [] as $word) {
            $candidate = $current === '' ? $word : $current.' '.$word;

            if (self::textWidth($candidate, $size) <= $maxWidth) {
                $current = $candidate;

                continue;
            }

            if ($current !== '') {
                $lines[] = $current;
            }
            $current = $word;
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        if (count($lines) > $maxLines) {
            $lines = array_slice($lines, 0, $maxLines);
            $lines[$maxLines - 1] = self::fit($lines[$maxLines - 1].' …', $size, $maxWidth);
        }

        return $lines;
    }

    private static function fit(string $text, int $size, int $maxWidth): string
    {
        while (mb_strlen($text) > 3 && self::textWidth($text, $size) > $maxWidth) {
            $text = mb_substr($text, 0, -2).'…';
        }

        return $text;
    }

    private static function roundedRect(GdImage $img, int $x1, int $y1, int $x2, int $y2, int $r, int $color): void
    {
        imagefilledrectangle($img, $x1 + $r, $y1, $x2 - $r, $y2, $color);
        imagefilledrectangle($img, $x1, $y1 + $r, $x2, $y2 - $r, $color);
        imagefilledellipse($img, $x1 + $r, $y1 + $r, $r * 2, $r * 2, $color);
        imagefilledellipse($img, $x2 - $r, $y1 + $r, $r * 2, $r * 2, $color);
        imagefilledellipse($img, $x1 + $r, $y2 - $r, $r * 2, $r * 2, $color);
        imagefilledellipse($img, $x2 - $r, $y2 - $r, $r * 2, $r * 2, $color);
    }

    /**
     * @param  int  $alpha  0 — opaque … 127 — transparent
     */
    private static function color(GdImage $img, string $hex, int $alpha = 0): int
    {
        [$r, $g, $b] = self::rgb($hex);

        return (int) imagecolorallocatealpha($img, $r, $g, $b, $alpha);
    }

    /**
     * @return array{0: int, 1: int, 2: int}
     */
    private static function rgb(string $hex): array
    {
        $hex = ltrim($hex, '#');

        return [(int) hexdec(substr($hex, 0, 2)), (int) hexdec(substr($hex, 2, 2)), (int) hexdec(substr($hex, 4, 2))];
    }

    private static function save(GdImage $img): string
    {
        $path = tempnam(sys_get_temp_dir(), 'bakht').'.png';
        imagepng($img, $path, 6);
        imagedestroy($img);

        return $path;
    }
}
