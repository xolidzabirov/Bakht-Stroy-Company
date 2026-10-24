<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteAccountRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Пароль — подтверждение удаления.
             *
             * @example secret123
             */
            'password' => ['required', 'string'],
        ];
    }
}
