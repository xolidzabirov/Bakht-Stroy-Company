<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Content\Database\Factories\BannerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Slide of the home page carousel.
 *
 * @property int $id
 * @property string $title
 * @property string|null $subtitle
 * @property string|null $button_text
 * @property string|null $link
 * @property int $sort_order
 * @property bool $is_active
 * @property Carbon|null $starts_at
 * @property Carbon|null $ends_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 *
 * @method static Builder<static> showing()
 */
#[UseFactory(BannerFactory::class)]
#[Fillable(['title', 'subtitle', 'button_text', 'link', 'sort_order', 'is_active', 'starts_at', 'ends_at'])]
class Banner extends Model implements HasMedia
{
    /** @use HasFactory<BannerFactory> */
    use HasFactory, InteractsWithMedia;

    public const IMAGE_COLLECTION = 'image';

    public const MOBILE_IMAGE_COLLECTION = 'image_mobile';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * Active banners whose show period includes now.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function showing(Builder $query): void
    {
        $query->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))
            ->orderBy('sort_order')
            ->orderByDesc('id');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::IMAGE_COLLECTION)->singleFile()->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
        $this->addMediaCollection(self::MOBILE_IMAGE_COLLECTION)->singleFile()->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('desktop')->nonOptimized()
            ->performOnCollections(self::IMAGE_COLLECTION)
            ->fit(Fit::Crop, 1920, 600)
            ->format('webp');

        $this->addMediaConversion('mobile')->nonOptimized()
            ->performOnCollections(self::MOBILE_IMAGE_COLLECTION, self::IMAGE_COLLECTION)
            ->fit(Fit::Crop, 800, 800)
            ->format('webp');
    }
}
