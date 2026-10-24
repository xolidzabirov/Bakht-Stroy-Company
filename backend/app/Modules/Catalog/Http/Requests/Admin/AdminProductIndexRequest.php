<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests\Admin;

use App\Modules\Catalog\DTO\ProductFilterData;
use App\Modules\Catalog\Http\Requests\ProductIndexRequest;
use Illuminate\Contracts\Validation\ValidationRule;

final class AdminProductIndexRequest extends ProductIndexRequest
{
    protected array $booleanFields = ['in_stock', 'featured', 'is_active'];

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            /** Фильтр по видимости: 1 — активные, 0 — скрытые, не передавать — все. */
            'is_active' => ['nullable', 'boolean'],
            /** @example new */
            'sort' => ['nullable', 'string', 'in:'.implode(',', ProductFilterData::SORTS)],
        ];
    }

    public function toFilters(): ProductFilterData
    {
        $filters = parent::toFilters();

        return new ProductFilterData(
            category: $filters->category,
            search: $filters->search,
            priceMin: $filters->priceMin,
            priceMax: $filters->priceMax,
            inStock: $filters->inStock,
            featured: $filters->featured,
            sort: $this->string('sort', 'new')->toString(),
            perPage: $filters->perPage,
            isActive: $this->filled('is_active') ? $this->boolean('is_active') : null,
        );
    }
}
