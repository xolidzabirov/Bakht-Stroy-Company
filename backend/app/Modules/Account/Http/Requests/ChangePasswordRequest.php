<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Requests;

use App\Shared\Rules\NotCommonPassword;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class ChangePasswordRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example secret123 */
            'current_password' => ['required', 'string'],
            /** @example newSecret123 */
            'password' => ['required', 'string', 'max:100', 'confirmed', 'different:current_password', Password::defaults(),
                new NotCommonPassword($this->user()?->email)],
            /** @example newSecret123 */
            'password_confirmation' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['current_password' => 'текущий пароль', 'password' => 'новый пароль'];
    }
}
