<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Requests;

use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateProfileRequest extends FormRequest
{
    public const LOCALES = ['ru', 'uz'];

    public const THEMES = ['light', 'dark', 'system'];

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $phone = $this->input('phone');
            $this->merge(['phone' => is_string($phone) && trim($phone) !== '' ? Phone::normalize($phone) : null]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example Халид */
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            /**
             * Телефон в любом формате; null — убрать. Один номер — один аккаунт.
             *
             * @example +998901234567
             */
            'phone' => ['sometimes', 'nullable', 'string', 'regex:'.Phone::REGEX,
                Rule::unique('users', 'phone')->ignore($this->user()?->getAuthIdentifier())],
            /** Язык интерфейса: ru, uz. */
            'locale' => ['sometimes', 'string', Rule::in(self::LOCALES)],
            /** Тема: light, dark, system. */
            'theme' => ['sometimes', 'string', Rule::in(self::THEMES)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Введите номер телефона в международном формате, например +998901234567.',
            'phone.unique' => 'Этот номер телефона уже привязан к другому аккаунту.',
        ];
    }

    /**
     * Only the fields that were sent.
     *
     * @return array{name?: string, phone?: string|null, locale?: string, theme?: string}
     */
    public function changes(): array
    {
        /** @var array{name?: string, phone?: string|null, locale?: string, theme?: string} $validated */
        $validated = $this->validated();

        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
        }

        return $validated;
    }
}
