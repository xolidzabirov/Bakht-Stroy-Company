<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use App\Modules\Auth\DTO\RegisterData;
use App\Modules\Auth\Support\RegistrationTicket;
use App\Shared\Rules\NotCommonPassword;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        RegistrationPhone::prepare($this);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Пропуск из шага с кодом (POST /auth/register/email/verify), действует 30 минут.
             */
            'registration_token' => ['required', 'string', 'max:2000'],
            /** @example Фирдавс */
            'first_name' => ['required', 'string', 'min:2', 'max:50'],
            /** @example Рахимов */
            'last_name' => ['required', 'string', 'min:2', 'max:50'],
            /**
             * Таджикский номер: по нему менеджер связывается по заказам.
             *
             * @example +992931234567
             */
            'phone' => RegistrationPhone::rules($this),
            /**
             * Не короче 8 символов, буквы и цифры; символы (!, #, ?) — ещё надёжнее.
             *
             * @example Stroy2026!
             */
            'password' => ['required', 'string', 'max:100', 'confirmed', Password::defaults(), new NotCommonPassword(RegistrationTicket::email($this->string('registration_token')->toString()))],
            /** @example Stroy2026! */
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
        return RegistrationPhone::messages();
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['first_name' => 'имя', 'last_name' => 'фамилия'];
    }

    public function toData(): RegisterData
    {
        return new RegisterData(
            firstName: trim($this->string('first_name')->toString()),
            lastName: trim($this->string('last_name')->toString()),
            registrationToken: $this->string('registration_token')->toString(),
            phone: $this->string('phone')->toString(),
            password: $this->string('password')->toString(),
            deviceName: DeviceName::from($this),
        );
    }
}
