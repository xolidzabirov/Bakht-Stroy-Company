<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests\Admin;

use App\Modules\Catalog\DTO\ProductData;
use App\Modules\Catalog\Enums\ProductUnit;
use App\Modules\Catalog\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Create (POST — main fields required) and partial update (PATCH — any subset of fields).
 */
final class SaveProductRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $product = $this->route('product');
        $productId = $product instanceof Product ? $product->id : null;
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            /** @example 2 */
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            /** @example Цемент М500 Д0, 50 кг */
            'name' => [$required, 'string', 'min:2', 'max:200'],
            /**
             * Латинский slug для URL. Если не указан — создаётся из названия.
             *
             * @example tsement-m500-d0-50-kg
             */
            'slug' => ['sometimes', 'nullable', 'string', 'max:220', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('products', 'slug')->ignore($productId)],
            /**
             * Артикул. Если не указан — BS-000123.
             *
             * @example BS-000002
             */
            'sku' => ['sometimes', 'nullable', 'string', 'max:50', Rule::unique('products', 'sku')->ignore($productId)],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            /**
             * Цена за единицу в сумах.
             *
             * @example 69000
             */
            'price' => [$required, 'integer', 'min:0', 'max:100000000000'],
            /**
             * Старая цена (для скидки), должна быть больше цены.
             *
             * @example 75000
             */
            'old_price' => ['sometimes', 'nullable', 'integer', 'gt:price'],
            /** @example bag */
            'unit' => [$required, Rule::enum(ProductUnit::class)],
            /** @example 650 */
            'stock' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            /** @example 1 */
            'min_order_qty' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            /**
             * Характеристики: [{ "name": "Марка", "value": "М500" }].
             */
            'specs' => ['sometimes', 'array', 'max:50'],
            'specs.*.name' => ['required', 'string', 'max:100'],
            'specs.*.value' => ['required', 'string', 'max:255'],
            /** Показывать в магазине. */
            'is_active' => ['sometimes', 'boolean'],
            /** Хит продаж. */
            'is_featured' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'Slug может содержать только латинские буквы, цифры и дефис.',
            'old_price.gt' => 'Старая цена должна быть больше текущей.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // On PATCH without price, compare old_price with the current price.
        $product = $this->route('product');

        if ($product instanceof Product && $this->has('old_price') && ! $this->has('price')) {
            $this->merge(['price' => $product->price]);
        }
    }

    public function toData(?Product $product = null): ProductData
    {
        $value = fn (string $key, mixed $current) => $this->has($key) ? $this->input($key) : $current;

        return new ProductData(
            categoryId: (int) $value('category_id', $product?->category_id),
            name: trim((string) $value('name', $product?->name)),
            slug: $this->filled('slug') ? $this->string('slug')->toString() : null,
            sku: $this->has('sku') ? ($this->filled('sku') ? trim($this->string('sku')->toString()) : null) : $product?->sku,
            description: $value('description', $product?->description),
            price: (int) $value('price', $product?->price),
            oldPrice: ($old = $value('old_price', $product?->old_price)) !== null ? (int) $old : null,
            unit: $this->has('unit') ? ProductUnit::from($this->string('unit')->toString()) : ($product->unit ?? ProductUnit::Piece),
            stock: (int) $value('stock', $product->stock ?? 0),
            minOrderQty: (int) $value('min_order_qty', $product->min_order_qty ?? 1),
            specs: $this->has('specs')
                ? collect($this->array('specs'))->map(fn (array $spec) => ['name' => (string) $spec['name'], 'value' => (string) $spec['value']])->values()->all()
                : ($product->specs ?? []),
            isActive: $this->has('is_active') ? $this->boolean('is_active') : ($product->is_active ?? true),
            isFeatured: $this->has('is_featured') ? $this->boolean('is_featured') : ($product->is_featured ?? false),
        );
    }
}
