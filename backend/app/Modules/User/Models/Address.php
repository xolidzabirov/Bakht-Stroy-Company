<?php

declare(strict_types=1);

namespace App\Modules\User\Models;

use App\Modules\User\Database\Factories\AddressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Saved delivery address of a client.
 *
 * @property int $id
 * @property int $user_id
 * @property string|null $title
 * @property string $city
 * @property string $street
 * @property string $house
 * @property string|null $apartment
 * @property string|null $comment
 * @property bool $is_default
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
#[UseFactory(AddressFactory::class)]
#[Fillable(['user_id', 'title', 'city', 'street', 'house', 'apartment', 'comment', 'is_default'])]
class Address extends Model
{
    /** @use HasFactory<AddressFactory> */
    use HasFactory;

    public const MAX_PER_USER = 10;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'is_default' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The shape stored in an order (orders.address).
     *
     * @return array{city: string, street: string, house: string, apartment: string|null, comment: string|null}
     */
    public function toSnapshot(): array
    {
        return [
            'city' => $this->city,
            'street' => $this->street,
            'house' => $this->house,
            'apartment' => $this->apartment,
            'comment' => $this->comment,
        ];
    }
}
