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
            'email' => is_string($this->input('email')) ? mb_strtolower(trim($this->input('email'))) : $this->input('email'),
            'phone' => is_string($this->input('phone')) && trim($this->input('phone')) !== ''
                ? Phone::normalize($this->input('phone'))
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
             * Email — используется для входа.
             *
             * @example client@gmail.com
             */
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            /** @example secret123 */
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            /** @example secret123 */
            'password_confirmation' => ['required', 'string'],
            /**
             * Телефон для связи по заказам (необязательно), в любом формате.
             *
             * @example +998901234567
             */
            'phone' => ['nullable', 'string', 'regex:'.Phone::REGEX, 'unique:users,phone'],
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
            'email.unique' => 'Этот email уже зарегистрирован.',
            'phone.regex' => 'Введите номер телефона в международном формате, например +998901234567.',
            'phone.unique' => 'Этот номер телефона уже зарегистрирован.',
        ];
    }

    public function toData(): RegisterData
    {
        return new RegisterData(
            name: trim($this->string('name')->toString()),
            email: $this->string('email')->toString(),
            phone: $this->input('phone'),
            password: $this->string('password')->toString(),
            deviceName: DeviceName::from($this),
        );
    }
}
