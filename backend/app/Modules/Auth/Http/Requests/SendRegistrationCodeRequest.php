<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SendRegistrationCodeRequest extends FormRequest
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
             * Email для входа: на него придёт код.
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
