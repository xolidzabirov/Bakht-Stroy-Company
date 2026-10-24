<?php

declare(strict_types=1);

namespace App\Modules\News\Models;

use App\Modules\Catalog\Models\Product;
use App\Modules\News\Database\Factories\NewsFactory;
use App\Modules\News\Enums\NewsType;
use App\Modules\User\Models\User;
use App\Shared\Support\SafeHtml;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * @property int $id
 * @property NewsType $type
 * @property string $title
 * @property string $slug
 * @property string|null $excerpt
 * @property string $body
 * @property string|null $video_url
 * @property bool $is_published
 * @property Carbon|null $published_at
 * @property bool $is_pinned
 * @property int $views_count
 * @property string|null $meta_title
 * @property string|null $meta_description
 * @property int|null $author_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User|null $author
 * @property-read Collection<int, Product> $products
 *
 * @method static Builder<static> published()
 */
#[Table('news')]
#[UseFactory(NewsFactory::class)]
#[Fillable([
    'type', 'title', 'slug', 'excerpt', 'body', 'video_url', 'is_published', 'published_at',
    'is_pinned', 'meta_title', 'meta_description', 'author_id',
])]
class News extends Model implements HasMedia
{
    /** @use HasFactory<NewsFactory> */
    use HasFactory, InteractsWithMedia, SoftDeletes;

    public const COVER_COLLECTION = 'cover';

    public const GALLERY_COLLECTION = 'gallery';

    public const MAX_GALLERY_IMAGES = 20;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_published' => false,
        'is_pinned' => false,
        'views_count' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => NewsType::class,
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'is_pinned' => 'boolean',
            'views_count' => 'integer',
            'author_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id')->withTrashed();
    }

    /**
     * Products shown inside the news (e.g. goods of a promotion).
     *
     * @return BelongsToMany<Product, $this>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'news_product')->withPivot('sort_order')->orderByPivot('sort_order');
    }

    /**
     * Visible to guests: published and the publication time has come.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true)->where('published_at', '<=', now());
    }

    public function isVisible(): bool
    {
        return $this->is_published && $this->published_at !== null && $this->published_at->lessThanOrEqualTo(now());
    }

    /**
     * draft — черновик, scheduled — запланирована, published — опубликована.
     */
    public function status(): string
    {
        return match (true) {
            ! $this->is_published => 'draft',
            $this->published_at?->isFuture() ?? false => 'scheduled',
            default => 'published',
        };
    }

    /**
     * The excerpt, or the first ~200 characters of the text.
     */
    public function summary(): string
    {
        return $this->excerpt ?: Str::limit(SafeHtml::toText($this->body), 200);
    }

    /**
     * Reading time in minutes (~180 words per minute), at least 1.
     */
    public function readingTime(): int
    {
        $words = count(preg_split('/\s+/u', SafeHtml::toText($this->body), -1, PREG_SPLIT_NO_EMPTY) ?: []);

        return max(1, (int) ceil($words / 180));
    }

    /**
     * Embed URL for a YouTube link (watch?v=, youtu.be/, shorts/), null for other links.
     */
    public function videoEmbedUrl(): ?string
    {
        if ($this->video_url === null) {
            return null;
        }

        $pattern = '~(?:youtube\.com/(?:watch\?(?:.*&)?v=|shorts/|embed/)|youtu\.be/)([A-Za-z0-9_-]{11})~';

        return preg_match($pattern, $this->video_url, $matches) ? 'https://www.youtube.com/embed/'.$matches[1] : null;
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::COVER_COLLECTION)
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection(self::GALLERY_COLLECTION)
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')->nonOptimized()->fit(Fit::Crop, 400, 260)->format('webp');
        $this->addMediaConversion('card')->nonOptimized()->fit(Fit::Crop, 800, 500)->format('webp');
        $this->addMediaConversion('full')->nonOptimized()->fit(Fit::Max, 1600, 1600)->format('webp');
    }
}
