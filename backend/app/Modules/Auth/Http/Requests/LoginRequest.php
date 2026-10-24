<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use App\Modules\Auth\DTO\LoginData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class LoginRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Телефон или email.
             *
             * @example +998901234567
             */
            'login' => ['required', 'string', 'max:255'],
            /** @example secret123 */
            'password' => ['required', 'string', 'max:255'],
            /**
             * Название устройства для списка сессий.
             *
             * @example Chrome Windows
             */
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function toData(): LoginData
    {
        return new LoginData(
            login: $this->string('login')->trim()->toString(),
            password: $this->string('password')->toString(),
            deviceName: DeviceName::from($this),
        );
    }
}
