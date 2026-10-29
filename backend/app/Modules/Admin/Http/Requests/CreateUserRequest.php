<?php

declare(strict_types=1);

namespace App\Modules\Admin\Http\Requests;

use App\Modules\User\Enums\Role;
use App\Shared\Rules\NotCommonPassword;
use App\Shared\Rules\ValidPhone;
use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

final class CreateUserRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->attributes->set('raw_phone', $this->input('phone'));

        $this->merge(array_filter([
            'email' => is_string($this->input('email')) ? mb_strtolower(trim($this->input('email'))) : null,
            'phone' => is_string($this->input('phone')) && trim($this->input('phone')) !== '' ? Phone::normalize($this->input('phone')) : null,
            'name' => is_string($this->input('name')) ? trim($this->input('name')) : null,
        ], fn ($value) => $value !== null));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example Фирдавс Каримов */
            'name' => ['required', 'string', 'min:2', 'max:100'],
            /** Логин для входа. @example manager@bakhtstroy.tj */
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            /** Необязательно. @example +992931234567 */
            'phone' => ['nullable', 'string', new ValidPhone($this->attributes->get('raw_phone')), Rule::unique('users', 'phone')],
            /** client — покупатель, manager — менеджер. */
            'role' => ['required', Rule::in([Role::Client->value, Role::Manager->value])],
            /** Пусто — сервер придумает надёжный пароль и вернёт его один раз. */
            'password' => ['nullable', 'string', 'max:100', Password::defaults(), new NotCommonPassword($this->input('email'))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'Пользователь с таким email уже есть.',
            'phone.unique' => 'Этот номер уже привязан к другому пользователю.',
        ];
    }

    /**
     * @return array{name: string, email: string, phone: string|null, role: Role, password: string|null}
     */
    public function payload(): array
    {
        return [
            'name' => $this->string('name')->toString(),
            'email' => $this->string('email')->toString(),
            'phone' => $this->filled('phone') ? $this->string('phone')->toString() : null,
            'role' => Role::from($this->string('role')->toString()),
            'password' => $this->filled('password') ? $this->string('password')->toString() : null,
        ];
    }
}
