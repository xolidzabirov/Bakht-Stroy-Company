<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class VerifyRegistrationCodeRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge(['email' => EmailRules::normalize($this->input('email'))]);
    }

    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            /**
             * Тот же email, на который отправлен код.
             *
             * @example client@gmail.com
             */
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            /**
             * 6-значный код из письма.
             *
             * @example 123456
             */
            'code' => ['required', 'string', 'digits:6'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['code' => 'код'];
    }
}
