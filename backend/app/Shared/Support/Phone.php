<?php

declare(strict_types=1);

namespace App\Shared\Support;

/**
 * Phone numbers in E.164 format: "+" and 11–15 digits (+998901234567).
 */
final class Phone
{
    public const REGEX = '/^\+\d{11,15}$/';

    /**
     * Normalize user input ("90 123-45-67", "8 (90) 123 45 67", "00998...") to E.164.
     * Returns the input unchanged (trimmed) when it does not look like a phone at all,
     * so validation can reject it with a proper message.
     */
    public static function normalize(string $value): string
    {
        $value = trim($value);
        $digits = (string) preg_replace('/\D+/', '', $value);

        if ($digits === '') {
            return $value;
        }

        if (str_starts_with($value, '+')) {
            return '+'.$digits;
        }

        if (str_starts_with($digits, '00')) {
            return '+'.substr($digits, 2);
        }

        $countryCode = (string) config('shop.phone.default_country_code');

        // Local number: 9 digits (90 123 45 67) or with a trunk prefix 8 (8 90 123 45 67).
        if (strlen($digits) === 9) {
            return '+'.$countryCode.$digits;
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '8')) {
            return '+'.$countryCode.substr($digits, 1);
        }

        return '+'.$digits;
    }

    public static function isValid(string $value): bool
    {
        return preg_match(self::REGEX, $value) === 1;
    }
}
