<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Requests\Admin;

use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Enums\PaymentStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class AdminOrderIndexRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** Статус или active — все незавершённые. */
            'status' => ['nullable', 'string', Rule::in(['active', ...array_column(OrderStatus::cases(), 'value')])],
            'payment_status' => ['nullable', Rule::enum(PaymentStatus::class)],
            'delivery_type' => ['nullable', Rule::enum(DeliveryType::class)],
            /** @example 2026-10-01 */
            'date_from' => ['nullable', 'date'],
            /** @example 2026-10-31 */
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            /**
             * Номер заказа, телефон, имя или email покупателя.
             *
             * @example BS-000012
             */
            'search' => ['nullable', 'string', 'max:100'],
            'user_id' => ['nullable', 'integer'],
            /** @example 20 */
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
