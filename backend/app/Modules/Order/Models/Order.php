<?php

declare(strict_types=1);

namespace App\Modules\Order\Models;

use App\Modules\Order\Database\Factories\OrderFactory;
use App\Modules\Order\Enums\DeliveryType;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Enums\PaymentMethod;
use App\Modules\Order\Enums\PaymentStatus;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $number
 * @property int $user_id
 * @property OrderStatus $status
 * @property PaymentMethod $payment_method
 * @property PaymentStatus $payment_status
 * @property DeliveryType $delivery_type
 * @property array{city: string, street: string, house: string, apartment?: string|null, comment?: string|null}|null $address
 * @property string $customer_name
 * @property string $customer_phone
 * @property string $customer_email
 * @property int $subtotal
 * @property int $delivery_price
 * @property int $discount
 * @property int $total
 * @property string|null $comment
 * @property Carbon|null $cancelled_at
 * @property Carbon|null $completed_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User $user
 * @property-read Collection<int, OrderItem> $items
 * @property-read Collection<int, OrderStatusHistory> $history
 */
#[UseFactory(OrderFactory::class)]
#[Fillable([
    'user_id', 'status', 'payment_method', 'payment_status', 'delivery_type', 'address',
    'customer_name', 'customer_phone', 'customer_email', 'subtotal', 'delivery_price', 'discount', 'total', 'comment',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'status' => OrderStatus::class,
            'payment_method' => PaymentMethod::class,
            'payment_status' => PaymentStatus::class,
            'delivery_type' => DeliveryType::class,
            'address' => 'array',
            'subtotal' => 'integer',
            'delivery_price' => 'integer',
            'discount' => 'integer',
            'total' => 'integer',
            'cancelled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('id');
    }

    /**
     * @return HasMany<OrderStatusHistory, $this>
     */
    public function history(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at')->orderBy('id');
    }

    public static function formatNumber(int $id): string
    {
        return sprintf('BS-%06d', $id);
    }
}
