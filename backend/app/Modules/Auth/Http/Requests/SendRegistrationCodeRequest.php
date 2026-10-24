<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class SendRegistrationCodeRequest extends FormRequest
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
            /**
             * Email, на который придёт код. Должен быть свободен и существовать.
             *
             * @example client@gmail.com
             */
            'email' => EmailRules::newAccount(),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return EmailRules::messages();
    }
}
