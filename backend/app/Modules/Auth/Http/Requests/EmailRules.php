<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

/**
 * Validation for a new account email: valid format, a real mail domain (MX record)
 * unless EMAIL_DNS_CHECK=false, and not registered yet.
 */
final class EmailRules
{
    /**
     * @return list<string>
     */
    public static function newAccount(): array
    {
        $format = config('shop.email_dns_check') ? 'email:rfc,dns' : 'email:rfc';

        return ['required', 'string', $format, 'max:255', 'unique:users,email'];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'email.unique' => 'Этот email уже зарегистрирован.',
            'email.email' => 'Введите существующий email: у домена должен быть почтовый сервер.',
        ];
    }

    public static function normalize(mixed $email): mixed
    {
        return is_string($email) ? mb_strtolower(trim($email)) : $email;
    }
}
