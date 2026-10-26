<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Requests;

use App\Shared\Rules\ValidPhone;
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
             * @example ["+992931234567", "+992372000000"]
             */
            'store.phones' => ['sometimes', 'array', 'max:5'],
            'store.phones.*' => ['string', new ValidPhone],
            /** @example info@bakhtstroy.uz */
            'store.email' => ['sometimes', 'nullable', 'email', 'max:255'],
            /** @example Душанбе, ул. Джабор Расулов */
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
            'store.socials.telegram_chat' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            'store.socials.instagram' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            /** @example https://wa.me/992907666609 */
            'store.socials.whatsapp' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            'store.socials.facebook' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            'store.socials.youtube' => ['sometimes', 'nullable', 'url:https', 'max:300'],

            'delivery' => ['sometimes', 'array'],
            /**
             * Стоимость доставки, в дирамах.
             *
             * @example 5000
             */
            'delivery.price' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            /**
             * Бесплатная доставка от этой суммы заказа, в дирамах (300000 = 3000 сом.); 0 — никогда.
             *
             * @example 300000
             */
            'delivery.free_from' => ['sometimes', 'integer', 'min:0', 'max:100000000000'],
            /** @example Склад: Душанбе, ул. Джабор Расулов */
            'delivery.pickup_address' => ['sometimes', 'nullable', 'string', 'max:300'],
            'delivery.note' => ['sometimes', 'nullable', 'string', 'max:1000'],

            'payment' => ['sometimes', 'array'],
            /**
             * Номер карты для перевода (Корти Милли / Visa).
             *
             * @example 9762 0000 1234 5678
             */
            'payment.card_number' => ['sometimes', 'nullable', 'string', 'regex:/^[0-9 ]{12,23}$/'],
            /** @example BAKHT STROY */
            'payment.card_holder' => ['sometimes', 'nullable', 'string', 'max:100'],
            /** @example Душанбе Сити Бонк */
            'payment.bank' => ['sometimes', 'nullable', 'string', 'max:100'],
            'payment.note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [];
    }
}
