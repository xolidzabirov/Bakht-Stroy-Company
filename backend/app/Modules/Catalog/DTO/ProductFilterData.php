<?php

declare(strict_types=1);

namespace App\Modules\Catalog\DTO;

final readonly class ProductFilterData
{
    public const SORTS = ['popular', 'new', 'price', '-price', 'name'];

    public function __construct(
        public ?string $category = null,
        public ?string $search = null,
        public ?int $priceMin = null,
        public ?int $priceMax = null,
        public bool $inStock = false,
        public bool $featured = false,
        public string $sort = 'popular',
        public int $perPage = 20,
        /** Admin only: filter by is_active; null = all. */
        public ?bool $isActive = null,
    ) {}
}
