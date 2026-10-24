<?php

declare(strict_types=1);

namespace App\Modules\Favorite\Models;

use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $user_id
 * @property int $product_id
 * @property Carbon $created_at
 * @property-read Product|null $product
 */
#[Table('favorites')]
#[Fillable(['user_id', 'product_id'])]
class Favorite extends Model
{
    public $incrementing = false;

    public const UPDATED_AT = null;

    protected $primaryKey = 'product_id';

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
