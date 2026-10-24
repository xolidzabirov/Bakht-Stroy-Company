<?php

declare(strict_types=1);

namespace App\Modules\Order\Models;

use App\Modules\Order\Enums\OrderStatus;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property OrderStatus $status
 * @property string|null $comment
 * @property int|null $changed_by
 * @property Carbon $created_at
 * @property-read User|null $author
 */
#[Table('order_status_history')]
#[Fillable(['order_id', 'status', 'comment', 'changed_by'])]
class OrderStatusHistory extends Model
{
    public const UPDATED_AT = null;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_id' => 'integer',
            'status' => OrderStatus::class,
            'changed_by' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by')->withTrashed();
    }
}
