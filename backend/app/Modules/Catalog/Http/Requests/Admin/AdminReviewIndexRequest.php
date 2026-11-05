<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class AdminReviewIndexRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** negative — 1–2 звезды, positive — 3–5 звёзд. */
            'filter' => ['nullable', 'string', 'in:negative,positive'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
