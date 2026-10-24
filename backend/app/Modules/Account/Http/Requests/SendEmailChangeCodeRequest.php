<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Requests;

use App\Modules\Auth\Http\Requests\EmailRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class SendEmailChangeCodeRequest extends FormRequest
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
             * Новый email: свободный и существующий. На него придёт код.
             *
             * @example new@gmail.com
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
