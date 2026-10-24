<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateStockRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Новый остаток на складе.
             *
             * @example 120
             */
            'stock' => ['required', 'integer', 'min:0', 'max:100000000'],
        ];
    }
}
