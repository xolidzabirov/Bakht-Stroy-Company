<?php

declare(strict_types=1);

namespace App\Shared\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use libphonenumber\NumberParseException;
use libphonenumber\PhoneNumberType;
use libphonenumber\PhoneNumberUtil;

/**
 * A real phone number with a country code:
 * - the person typed the country code (+992…, 00992… or 992…),
 * - the number exists in the country's numbering plan (Google libphonenumber),
 * - it is a mobile or landline number (not premium / shared cost services),
 * - it is not an obvious fake like +992 99 999 99 99 or +992 93 000 00 00.
 *
 * Validates the normalized E.164 value; the raw input is passed to check the country code.
 */
final class ValidPhone implements ValidationRule
{
    private const ALLOWED_TYPES = [
        PhoneNumberType::MOBILE,
        PhoneNumberType::FIXED_LINE,
        PhoneNumberType::FIXED_LINE_OR_MOBILE,
    ];

    public function __construct(private readonly mixed $rawInput = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            $fail('Укажите номер телефона.');

            return;
        }

        if (! self::hasCountryCode(is_string($this->rawInput) ? $this->rawInput : $value)) {
            $fail('Укажите номер с кодом страны, например +992 93 123 45 67.');

            return;
        }

        $util = PhoneNumberUtil::getInstance();

        try {
            $number = $util->parse($value, null);
        } catch (NumberParseException) {
            $fail('Проверьте, пожалуйста, номер — кажется, в нём ошибка.');

            return;
        }

        if (! $util->isValidNumber($number) || ! in_array($util->getNumberType($number), self::ALLOWED_TYPES, true)) {
            $fail('Такого номера не существует. Проверьте, пожалуйста, код страны и цифры.');

            return;
        }

        if (self::looksFake((string) $number->getNationalNumber())) {
            $fail('Похоже, это не настоящий номер. Укажите номер, по которому с вами можно связаться.');
        }
    }

    /**
     * "+992…", "00992…" or a full international number without "+" (11+ digits).
     */
    public static function hasCountryCode(string $raw): bool
    {
        $raw = trim($raw);
        $digits = (string) preg_replace('/\D+/', '', $raw);

        return str_starts_with($raw, '+') || str_starts_with($digits, '00') || strlen($digits) >= 11;
    }

    /**
     * All digits the same, or the subscriber part (last 7 digits) made of one digit.
     */
    private static function looksFake(string $national): bool
    {
        if (preg_match('/^(\d)\1+$/', $national) === 1) {
            return true;
        }

        return strlen($national) >= 7 && preg_match('/^(\d)\1{6}$/', substr($national, -7)) === 1;
    }
}
