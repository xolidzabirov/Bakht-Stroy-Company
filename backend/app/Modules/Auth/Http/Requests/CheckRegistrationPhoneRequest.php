<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CheckRegistrationPhoneRequest extends FormRequest
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
             * Таджикский номер: +992 и 9 цифр (или только 9 цифр).
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
