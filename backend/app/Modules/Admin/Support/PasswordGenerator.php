<?php

declare(strict_types=1);

namespace App\Modules\Admin\Support;

/**
 * Passwords the admin hands to a new manager (or a customer) by phone or in a messenger:
 * 12 characters without look-alikes (no 0/O, 1/l/I), always with a capital, a small letter and a digit,
 * so they satisfy Password::defaults() and are easy to dictate.
 */
final class PasswordGenerator
{
    private const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

    private const LOWER = 'abcdefghijkmnpqrstuvwxyz';

    private const DIGITS = '23456789';

    public static function make(int $length = 12): string
    {
        $all = self::UPPER.self::LOWER.self::DIGITS;
        $chars = [self::pick(self::UPPER), self::pick(self::LOWER), self::pick(self::DIGITS)];

        while (count($chars) < $length) {
            $chars[] = self::pick($all);
        }

        // Fisher–Yates with a cryptographic source, so the required characters are not always first.
        for ($i = count($chars) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$chars[$i], $chars[$j]] = [$chars[$j], $chars[$i]];
        }

        return implode('', $chars);
    }

    private static function pick(string $alphabet): string
    {
        return $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
}
