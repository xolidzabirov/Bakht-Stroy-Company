<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class ReorderCategoriesRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** Новый порядок: [{ "id": 3, "sort_order": 0 }, { "id": 1, "sort_order": 1 }]. */
            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.id' => ['required', 'integer', 'distinct', 'exists:categories,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:0', 'max:100000'],
        ];
    }

    /**
     * @return list<array{id: int, sort_order: int}>
     */
    public function items(): array
    {
        return collect($this->array('items'))
            ->map(fn (array $item) => ['id' => (int) $item['id'], 'sort_order' => (int) $item['sort_order']])
            ->values()
            ->all();
    }
}
