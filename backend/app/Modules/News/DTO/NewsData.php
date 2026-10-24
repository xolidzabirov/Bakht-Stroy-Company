<?php

declare(strict_types=1);

namespace App\Modules\News\DTO;

use App\Modules\News\Enums\NewsType;
use Illuminate\Support\Carbon;

final readonly class NewsData
{
    /**
     * @param  list<int>|null  $productIds  null — do not change linked products
     */
    public function __construct(
        public NewsType $type,
        public string $title,
        public ?string $slug,
        public ?string $excerpt,
        public string $body,
        public ?string $videoUrl,
        public bool $isPublished,
        public ?Carbon $publishedAt,
        public bool $isPinned,
        public ?string $metaTitle,
        public ?string $metaDescription,
        public ?array $productIds,
    ) {}
}
