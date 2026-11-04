<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Requests;

use App\Modules\Order\DTO\PlaceOrderData;
use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\PaymentMethod;
use App\Shared\Rules\ValidPhone;
use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class QuickOrderRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->attributes->set('raw_phone', $this->input('customer_phone'));

        if (is_string($this->input('customer_phone')) && trim($this->input('customer_phone')) !== '') {
            $this->merge(['customer_phone' => Phone::normalize($this->input('customer_phone'))]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example 1 */
            'product_id' => ['required', 'integer', 'exists:products,id'],
            /** @example 2 */
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            /** @example Халид */
            'customer_name' => ['required', 'string', 'min:2', 'max:100'],
            /** @example +992931234567 */
            'customer_phone' => ['required', 'string', new ValidPhone($this->attributes->get('raw_phone'))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['customer_phone' => 'телефон', 'customer_name' => 'имя'];
    }

    /** The manager calls back and settles delivery and payment; until then it stands as pickup and cash. */
    public function toData(): PlaceOrderData
    {
        return new PlaceOrderData(
            deliveryType: DeliveryType::Pickup,
            paymentMethod: PaymentMethod::Cash,
            customerName: trim($this->string('customer_name')->toString()),
            customerPhone: $this->string('customer_phone')->toString(),
            address: null,
            comment: 'Быстрый заказ: перезвонить и уточнить доставку и оплату.',
        );
    }
}
