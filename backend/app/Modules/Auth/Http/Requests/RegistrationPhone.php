<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use App\Shared\Rules\ValidPhone;
use App\Shared\Support\Phone;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Phone of a new account: a real Tajik number (+992) with Telegram, not used by another account.
 * The input may be "93 123 45 67", "+992 93 123-45-67" — it is normalized to +992931234567.
 */
final class RegistrationPhone
{
    public static function prepare(FormRequest $request): void
    {
        $raw = $request->input('phone');

        if (! is_string($raw) || trim($raw) === '') {
            return;
        }

        $digits = (string) preg_replace('/\D+/', '', $raw);
        // 9 local digits typed after the fixed "+992" in the form.
        $value = strlen($digits) === 9 ? '+992'.$digits : $raw;

        $request->attributes->set('raw_phone', strlen($digits) === 9 ? $value : $raw);
        $request->merge(['phone' => Phone::normalize($value)]);
    }

    /**
     * @return list<mixed>
     */
    public static function rules(FormRequest $request, bool $mustBeFree = true): array
    {
        return [
            'required',
            'string',
            new ValidPhone($request->attributes->get('raw_phone')),
            function (string $attribute, mixed $value, Closure $fail): void {
                if (is_string($value) && ! str_starts_with($value, '+992')) {
                    $fail('Нужен таджикский номер: +992 и 9 цифр, например +992 93 123 45 67.');
                }
            },
            ...($mustBeFree ? ['unique:users,phone'] : []),
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'phone.required' => 'Укажите номер телефона.',
            'phone.unique' => 'Этот номер уже зарегистрирован. Войдите в аккаунт или восстановите пароль.',
        ];
    }
}
