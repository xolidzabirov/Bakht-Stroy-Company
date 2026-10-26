<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Create (POST — city, street, house required) and partial update (PATCH).
 */
final class SaveAddressRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            /**
             * Название для себя.
             *
             * @example Объект на Чиланзаре
             */
            'title' => ['sometimes', 'nullable', 'string', 'max:50'],
            /** @example Душанбе */
            'city' => [$required, 'string', 'max:100'],
            /** @example ул. Бунёдкор */
            'street' => [$required, 'string', 'max:200'],
            /** @example 12А */
            'house' => [$required, 'string', 'max:20'],
            /** @example 45 */
            'apartment' => ['sometimes', 'nullable', 'string', 'max:20'],
            /** @example Въезд со двора, ворота синие */
            'comment' => ['sometimes', 'nullable', 'string', 'max:500'],
            /** Сделать основным адресом. */
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['city' => 'город', 'street' => 'улица', 'house' => 'дом', 'apartment' => 'квартира'];
    }

    /**
     * @return array<string, mixed>
     */
    public function attributesToSave(): array
    {
        return collect($this->validated())
            ->map(fn ($value, $key) => is_string($value) ? (trim($value) === '' ? null : trim($value)) : $value)
            ->map(fn ($value, $key) => $key === 'is_default' ? (bool) $value : $value)
            ->all();
    }
}
