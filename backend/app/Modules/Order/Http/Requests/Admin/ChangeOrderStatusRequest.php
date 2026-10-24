<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Requests\Admin;

use App\Modules\Order\Enums\OrderStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ChangeOrderStatusRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** confirmed, assembling, delivering, completed или cancelled (см. next_statuses заказа). */
            'status' => ['required', Rule::enum(OrderStatus::class)],
            /**
             * Комментарий в историю (видит покупатель).
             *
             * @example Подтвердили по телефону, доставка завтра до 12:00
             */
            'comment' => ['nullable', 'string', 'max:500'],
        ];
    }
}
