<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Requests;

use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Any subset of settings: { "store": {...}, "delivery": {...} }.
 */
final class UpdateSettingsRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $phones = $this->input('store.phones');

        if (is_array($phones)) {
            $this->merge(['store' => [
                ...(array) $this->input('store'),
                'phones' => array_values(array_map(fn ($phone) => is_string($phone) ? Phone::normalize($phone) : $phone, $phones)),
            ]]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'store' => ['sometimes', 'array'],
            /** @example Bakht Stroy */
            'store.name' => ['sometimes', 'string', 'max:100'],
            'store.description' => ['sometimes', 'nullable', 'string', 'max:500'],
            /**
             * Телефоны магазина.
             *
             * @example ["+998901234567", "+998712000000"]
             */
            'store.phones' => ['sometimes', 'array', 'max:5'],
            'store.phones.*' => ['string', 'regex:'.Phone::REGEX],
            /** @example info@bakhtstroy.uz */
            'store.email' => ['sometimes', 'nullable', 'email', 'max:255'],
            /** @example Ташкент, Сергелийский р-н, ул. Янги Сергели, 15 */
            'store.address' => ['sometimes', 'nullable', 'string', 'max:300'],
            /** @example Пн–Сб 08:00–19:00 */
            'store.work_hours' => ['sometimes', 'nullable', 'string', 'max:200'],
            'store.map' => ['sometimes', 'array'],
            /** @example 41.2280 */
            'store.map.lat' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            /** @example 69.2190 */
            'store.map.lng' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'store.socials' => ['sometimes', 'array'],
            'store.socials.telegram' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            'store.socials.instagram' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            'store.socials.facebook' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            'store.socials.youtube' => ['sometimes', 'nullable', 'url:https', 'max:300'],

            'delivery' => ['sometimes', 'array'],
            /**
             * Стоимость доставки, сум.
             *
             * @example 50000
             */
            'delivery.price' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            /**
             * Бесплатная доставка от этой суммы заказа, сум; 0 — никогда.
             *
             * @example 3000000
             */
            'delivery.free_from' => ['sometimes', 'integer', 'min:0', 'max:100000000000'],
            /** @example Склад: Ташкент, ул. Янги Сергели, 15 */
            'delivery.pickup_address' => ['sometimes', 'nullable', 'string', 'max:300'],
            'delivery.note' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['store.phones.*.regex' => 'Телефон в международном формате, например +998901234567.'];
    }
}
