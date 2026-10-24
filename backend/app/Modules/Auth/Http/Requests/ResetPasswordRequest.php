<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class ResetPasswordRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example client@gmail.com */
            'email' => ['required', 'string', 'email', 'max:255'],
            /**
             * 6-значный код из письма.
             *
             * @example 123456
             */
            'code' => ['required', 'string', 'digits:6'],
            /** @example newSecret123 */
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            /** @example newSecret123 */
            'password_confirmation' => ['required', 'string'],
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
