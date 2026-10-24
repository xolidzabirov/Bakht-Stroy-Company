<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class CancelOrderRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Причина отмены (необязательно).
             *
             * @example Передумал
             */
            'reason' => ['nullable', 'string', 'max:300'],
        ];
    }
}
