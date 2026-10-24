<?php

declare(strict_types=1);

namespace App\Modules\Cart\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class AddToCartRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example 2 */
            'product_id' => ['required', 'integer', 'min:1'],
            /**
             * Сколько добавить (прибавляется к тому, что уже в корзине).
             *
             * @example 10
             */
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
