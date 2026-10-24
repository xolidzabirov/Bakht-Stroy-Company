<?php

declare(strict_types=1);

namespace App\Shared\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rejects the most guessed passwords and passwords built from the email.
 * Length, letters and digits are checked by Password::defaults().
 */
final class NotCommonPassword implements ValidationRule
{
    /**
     * Passwords that bots try first (already 8+ chars with letters and digits).
     */
    private const COMMON = [
        'password1', 'password12', 'password123', 'passw0rd', 'p@ssw0rd', 'qwerty123', 'qwerty1234', 'qwe123456',
        '1q2w3e4r', '1q2w3e4r5t', 'q1w2e3r4', 'q1w2e3r4t5', '1qaz2wsx', 'zaq12wsx', 'abc12345', 'abcd1234', 'a1234567',
        '12345678a', '123456789a', 'a12345678', 'admin123', 'admin1234', 'administrator1', 'iloveyou1', 'welcome1',
        'letmein1', 'test1234', 'test12345', 'user1234', 'asdf1234', 'asd123456', 'qazwsx123', 'parol123', 'parol1234',
        'bakht123', 'bakhtstroy1', 'stroy1234', 'tashkent1', 'uzbekistan1',
    ];

    public function __construct(private readonly ?string $email = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $password = mb_strtolower($value);
        $onlyLettersAndDigits = fn (string $text): string => (string) preg_replace('/[^\p{L}\p{N}]+/u', '', $text);

        if (in_array($password, self::COMMON, true)) {
            $fail('Этот пароль слишком простой и часто встречается. Придумайте другой — например, добавьте символ !, # или ?.');

            return;
        }

        // "new.client@gmail.com" also matches "newclient2026".
        $login = $this->email !== null ? $onlyLettersAndDigits(mb_strtolower((string) strstr($this->email, '@', true))) : '';

        if (mb_strlen($login) >= 4 && str_contains($onlyLettersAndDigits($password), $login)) {
            $fail('Пароль не должен содержать ваш email. Придумайте другой.');
        }
    }
}
