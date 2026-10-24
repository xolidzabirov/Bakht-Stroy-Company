<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Resources;

use App\Modules\Catalog\Http\Resources\ImageResource;
use App\Modules\Catalog\Http\Resources\ProductListResource;
use App\Modules\Catalog\Models\Product;
use App\Modules\News\Models\News;
use Illuminate\Http\Request;

/**
 * Full news page.
 *
 * @mixin News
 */
class NewsResource extends NewsListResource
{
    /**
     * Neighbours and similar news, set by the controller.
     *
     * @var array{previous: ?News, next: ?News, related: iterable<News>}|null
     */
    public ?array $around = null;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            /** Текст в HTML (уже очищен от опасного кода). */
            'body' => $this->body,
            'video_url' => $this->video_url,
            /**
             * Готовая ссылка для iframe YouTube или null.
             *
             * @example https://www.youtube.com/embed/dQw4w9WgXcQ
             */
            'video_embed_url' => $this->videoEmbedUrl(),
            /** @var list<ImageResource> */
            'gallery' => ImageResource::collection($this->whenLoaded('media', fn () => $this->getMedia(News::GALLERY_COLLECTION))),
            /** Товары из новости (только те, что сейчас продаются). */
            'products' => ProductListResource::collection($this->whenLoaded('products', fn () => $this->products
                ->filter(fn (Product $product) => $product->isVisible())->values())),
            'meta' => [
                'title' => $this->meta_title ?: $this->title,
                'description' => $this->meta_description ?: $this->summary(),
            ],
            'previous' => $this->when($this->around !== null, fn () => $this->link($this->around['previous'] ?? null)),
            'next' => $this->when($this->around !== null, fn () => $this->link($this->around['next'] ?? null)),
            /** @var list<NewsListResource> */
            'related' => $this->when($this->around !== null, fn () => NewsListResource::collection($this->around['related'] ?? [])),
        ];
    }

    /**
     * @return array{title: string, slug: string}|null
     */
    private function link(?News $news): ?array
    {
        return $news ? ['title' => $news->title, 'slug' => $news->slug] : null;
    }
}
