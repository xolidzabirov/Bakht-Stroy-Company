<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Resources;

use App\Modules\Catalog\Http\Resources\ProductListResource;
use App\Modules\News\Models\News;
use Illuminate\Http\Request;

/**
 * News for the admin panel: all fields, status and author.
 *
 * @mixin News
 */
final class AdminNewsResource extends NewsResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            /** Своё краткое описание (excerpt в списке — с запасным вариантом). */
            'excerpt_raw' => $this->excerpt,
            /** draft, scheduled, published. */
            'status' => $this->status(),
            'is_published' => $this->is_published,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            /** Все привязанные товары, включая скрытые. */
            'products' => ProductListResource::collection($this->whenLoaded('products')),
            'author' => $this->whenLoaded('author', fn () => $this->author ? ['id' => $this->author->id, 'name' => $this->author->name] : null),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
