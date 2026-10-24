<?php

declare(strict_types=1);

namespace App\Modules\Catalog\DTO;

final readonly class CategoryData
{
    public function __construct(
        public string $name,
        public ?string $slug,
        public ?int $parentId,
        public ?string $description,
        public int $sortOrder,
        public bool $isActive,
    ) {}
}
