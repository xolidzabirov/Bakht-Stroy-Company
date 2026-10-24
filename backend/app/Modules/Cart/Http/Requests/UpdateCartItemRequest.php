<?php

declare(strict_types=1);

namespace App\Modules\Cart\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateCartItemRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Новое количество.
             *
             * @example 20
             */
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
