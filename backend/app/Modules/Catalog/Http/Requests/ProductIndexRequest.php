<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests;

use App\Modules\Catalog\DTO\ProductFilterData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProductIndexRequest extends FormRequest
{
    /**
     * Query flags may come as "true"/"false" from the browser.
     *
     * @var list<string>
     */
    protected array $booleanFields = ['in_stock', 'featured'];

    protected function prepareForValidation(): void
    {
        foreach ($this->booleanFields as $field) {
            $value = $this->query($field);

            if ($value === 'true' || $value === 'false') {
                $this->merge([$field => $value === 'true' ? '1' : '0']);
            }
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Slug категории. У корневой категории показываются и товары подкатегорий.
             *
             * @example tsement-i-sukhie-smesi
             */
            'category' => ['nullable', 'string', 'max:140'],
            /**
             * Поиск по названию, описанию и артикулу.
             *
             * @example цемент
             */
            'search' => ['nullable', 'string', 'max:100'],
            /** @example 10000 */
            'price_min' => ['nullable', 'integer', 'min:0'],
            /** @example 500000 */
            'price_max' => ['nullable', 'integer', 'min:0', ...($this->filled('price_min') ? ['gte:price_min'] : [])],
            /** Только товары в наличии. */
            'in_stock' => ['nullable', 'boolean'],
            /** Только хиты продаж. */
            'featured' => ['nullable', 'boolean'],
            /**
             * Сортировка: popular (по умолчанию), new, price, -price (дороже сначала), name.
             *
             * @example price
             */
            'sort' => ['nullable', 'string', 'in:'.implode(',', ProductFilterData::SORTS)],
            /** @example 20 */
            'per_page' => ['nullable', 'integer', 'min:1', 'max:60'],
            /** @example 1 */
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function toFilters(): ProductFilterData
    {
        return new ProductFilterData(
            category: $this->filled('category') ? $this->string('category')->toString() : null,
            search: $this->filled('search') ? $this->string('search')->trim()->toString() : null,
            priceMin: $this->filled('price_min') ? $this->integer('price_min') : null,
            priceMax: $this->filled('price_max') ? $this->integer('price_max') : null,
            inStock: $this->boolean('in_stock'),
            featured: $this->boolean('featured'),
            sort: $this->string('sort', 'popular')->toString(),
            perPage: $this->integer('per_page', 20),
            isActive: null,
        );
    }
}
