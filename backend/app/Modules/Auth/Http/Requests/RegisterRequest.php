<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use App\Modules\Auth\DTO\RegisterData;
use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'phone' => is_string($this->input('phone')) ? Phone::normalize($this->input('phone')) : $this->input('phone'),
            'email' => is_string($this->input('email')) && $this->input('email') !== ''
                ? mb_strtolower(trim($this->input('email')))
                : null,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Имя покупателя.
             *
             * @example Халид
             */
            'name' => ['required', 'string', 'min:2', 'max:100'],
            /**
             * Телефон в любом формате, сохраняется как E.164.
             *
             * @example +998901234567
             */
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX, 'unique:users,phone'],
            /** @example client@example.com */
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            /** @example secret123 */
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            /** @example secret123 */
            'password_confirmation' => ['required', 'string'],
            /**
             * Название устройства для списка сессий.
             *
             * @example Chrome Windows
             */
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Введите номер телефона в международном формате, например +998901234567.',
            'phone.unique' => 'Этот номер телефона уже зарегистрирован.',
            'email.unique' => 'Этот email уже зарегистрирован.',
        ];
    }

    public function toData(): RegisterData
    {
        return new RegisterData(
            name: trim($this->string('name')->toString()),
            phone: $this->string('phone')->toString(),
            email: $this->input('email'),
            password: $this->string('password')->toString(),
            deviceName: DeviceName::from($this),
        );
    }
}
