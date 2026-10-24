<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Models;

use App\Modules\Catalog\Database\Factories\ProductFactory;
use App\Modules\Catalog\Enums\ProductUnit;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * @property int $id
 * @property int $category_id
 * @property string $name
 * @property string $slug
 * @property string|null $sku
 * @property string|null $description
 * @property int $price
 * @property int|null $old_price
 * @property ProductUnit $unit
 * @property int $stock
 * @property int $min_order_qty
 * @property list<array{name: string, value: string}> $specs
 * @property bool $is_active
 * @property bool $is_featured
 * @property int $views_count
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Category $category
 *
 * @method static Builder<static> active()
 * @method static Builder<static> visible()
 */
#[UseFactory(ProductFactory::class)]
#[Fillable([
    'category_id', 'name', 'slug', 'sku', 'description', 'price', 'old_price', 'unit',
    'stock', 'min_order_qty', 'specs', 'is_active', 'is_featured',
])]
class Product extends Model implements HasMedia
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, InteractsWithMedia, SoftDeletes;

    public const IMAGES_COLLECTION = 'images';

    public const MAX_IMAGES = 10;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'specs' => '[]',
        'stock' => 0,
        'min_order_qty' => 1,
        'is_active' => true,
        'is_featured' => false,
        'views_count' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'price' => 'integer',
            'old_price' => 'integer',
            'unit' => ProductUnit::class,
            'stock' => 'integer',
            'min_order_qty' => 'integer',
            'specs' => 'array',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'views_count' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * What guests see in the shop: active products in active categories.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function visible(Builder $query): void
    {
        $query->where('products.is_active', true)
            ->whereHas('category', fn (Builder $category) => $category->where('is_active', true));
    }

    public function inStock(): bool
    {
        return $this->stock >= $this->min_order_qty;
    }

    public function isVisible(): bool
    {
        return $this->is_active && $this->category->is_active;
    }

    /**
     * Discount in percent when an old price is set, e.g. 15.
     */
    public function discountPercent(): ?int
    {
        if ($this->old_price === null || $this->old_price <= $this->price) {
            return null;
        }

        return (int) round(100 - $this->price * 100 / $this->old_price);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::IMAGES_COLLECTION)
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')->nonOptimized()->fit(Fit::Contain, 300, 300)->format('webp');
        $this->addMediaConversion('card')->nonOptimized()->fit(Fit::Contain, 600, 600)->format('webp');
        $this->addMediaConversion('full')->nonOptimized()->fit(Fit::Max, 1600, 1600)->format('webp');
    }
}
