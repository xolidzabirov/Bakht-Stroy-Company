<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Requests;

use App\Modules\Auth\Http\Requests\EmailRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class ChangeEmailRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['email' => EmailRules::normalize($this->input('email'))]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example new@gmail.com */
            'email' => EmailRules::newAccount(),
            /**
             * Код из письма на новый email.
             *
             * @example 123456
             */
            'code' => ['required', 'string', 'digits:6'],
            /**
             * Текущий пароль — подтверждение.
             *
             * @example secret123
             */
            'password' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return EmailRules::messages();
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['code' => 'код'];
    }
}
