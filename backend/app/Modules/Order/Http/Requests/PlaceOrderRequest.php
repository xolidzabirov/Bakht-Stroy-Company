<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Requests;

use App\Modules\Order\DTO\PlaceOrderData;
use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\PaymentMethod;
use App\Modules\User\Models\User;
use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class PlaceOrderRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('customer_phone')) && trim($this->input('customer_phone')) !== '') {
            $this->merge(['customer_phone' => Phone::normalize($this->input('customer_phone'))]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $hasPhone = $user instanceof User && $user->phone !== null;
        $delivery = DeliveryType::Delivery->value;

        return [
            /** delivery — доставка, pickup — самовывоз со склада (бесплатно). */
            'delivery_type' => ['required', Rule::enum(DeliveryType::class)],
            /** cash — наличными, card_on_delivery — картой при получении, transfer — перечислением. */
            'payment_method' => ['required', Rule::enum(PaymentMethod::class)],
            /**
             * Имя получателя. По умолчанию — имя из профиля.
             *
             * @example Халид
             */
            'customer_name' => ['nullable', 'string', 'min:2', 'max:100'],
            /**
             * Телефон для связи. Обязателен, если в профиле нет телефона.
             *
             * @example +998901234567
             */
            'customer_phone' => [$hasPhone ? 'nullable' : 'required', 'string', 'regex:'.Phone::REGEX],
            /** Адрес доставки — обязателен при delivery_type=delivery. */
            'address' => ["required_if:delivery_type,{$delivery}", 'nullable', 'array'],
            /** @example Ташкент */
            'address.city' => ["required_if:delivery_type,{$delivery}", 'nullable', 'string', 'max:100'],
            /** @example ул. Амира Темура */
            'address.street' => ["required_if:delivery_type,{$delivery}", 'nullable', 'string', 'max:200'],
            /** @example 15 */
            'address.house' => ["required_if:delivery_type,{$delivery}", 'nullable', 'string', 'max:20'],
            /** @example 42 */
            'address.apartment' => ['nullable', 'string', 'max:20'],
            /** @example Подъезд 2, позвонить за час */
            'address.comment' => ['nullable', 'string', 'max:500'],
            /** Комментарий к заказу. */
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'customer_phone.required' => 'Укажите телефон для связи по заказу.',
            'customer_phone.regex' => 'Введите номер телефона в международном формате, например +998901234567.',
            'address.required_if' => 'Укажите адрес доставки.',
            'address.*.required_if' => 'Заполните адрес доставки: город, улицу и дом.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'address.city' => 'город',
            'address.street' => 'улица',
            'address.house' => 'дом',
            'customer_phone' => 'телефон',
            'customer_name' => 'имя получателя',
        ];
    }

    public function toData(User $user): PlaceOrderData
    {
        $deliveryType = DeliveryType::from($this->string('delivery_type')->toString());

        return new PlaceOrderData(
            deliveryType: $deliveryType,
            paymentMethod: PaymentMethod::from($this->string('payment_method')->toString()),
            customerName: $this->filled('customer_name') ? trim($this->string('customer_name')->toString()) : $user->name,
            customerPhone: $this->filled('customer_phone') ? $this->string('customer_phone')->toString() : (string) $user->phone,
            address: $deliveryType === DeliveryType::Delivery ? [
                'city' => trim((string) $this->input('address.city')),
                'street' => trim((string) $this->input('address.street')),
                'house' => trim((string) $this->input('address.house')),
                'apartment' => $this->filled('address.apartment') ? trim((string) $this->input('address.apartment')) : null,
                'comment' => $this->filled('address.comment') ? trim((string) $this->input('address.comment')) : null,
            ] : null,
            comment: $this->filled('comment') ? trim($this->string('comment')->toString()) : null,
        );
    }
}
