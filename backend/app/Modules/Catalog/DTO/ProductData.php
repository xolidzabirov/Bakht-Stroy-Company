<?php

declare(strict_types=1);

namespace App\Modules\Catalog\DTO;

use App\Modules\Catalog\Enums\ProductUnit;

final readonly class ProductData
{
    /**
     * @param  list<array{name: string, value: string}>  $specs
     */
    public function __construct(
        public int $categoryId,
        public string $name,
        public ?string $slug,
        public ?string $sku,
        public ?string $description,
        public int $price,
        public ?int $oldPrice,
        public ProductUnit $unit,
        public int $stock,
        public int $minOrderQty,
        public array $specs,
        public bool $isActive,
        public bool $isFeatured,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toAttributes(): array
    {
        return [
            'category_id' => $this->categoryId,
            'name' => $this->name,
            'sku' => $this->sku,
            'description' => $this->description,
            'price' => $this->price,
            'old_price' => $this->oldPrice,
            'unit' => $this->unit,
            'stock' => $this->stock,
            'min_order_qty' => $this->minOrderQty,
            'specs' => $this->specs,
            'is_active' => $this->isActive,
            'is_featured' => $this->isFeatured,
        ];
    }
}
