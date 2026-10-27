<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SendPhoneCodeRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        RegistrationPhone::prepare($this);
    }

    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            /**
             * Таджикский номер с Telegram: +992 и 9 цифр (или только 9 цифр). Код придёт в Telegram этого номера.
             *
             * @example +992931234567
             */
            'phone' => RegistrationPhone::rules($this),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return RegistrationPhone::messages();
    }
}
