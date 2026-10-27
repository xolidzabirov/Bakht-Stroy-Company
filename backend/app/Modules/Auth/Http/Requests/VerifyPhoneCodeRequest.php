<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class VerifyPhoneCodeRequest extends FormRequest
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
             * Тот же номер, на который отправлен код.
             *
             * @example +992931234567
             */
            'phone' => RegistrationPhone::rules($this),
            /**
             * 6-значный код из Telegram.
             *
             * @example 123456
             */
            'code' => ['required', 'string', 'digits:6'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return RegistrationPhone::messages();
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['code' => 'код'];
    }
}
