<?php

declare(strict_types=1);

namespace App\Modules\Chat\Models;

use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * The customer's single conversation with the shop. The manager is assigned on the first staff reply.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $manager_id
 * @property Carbon|null $last_message_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property int|null $unread_for_staff
 * @property int|null $unread_for_client
 * @property-read User $user
 * @property-read User|null $manager
 * @property-read ChatMessage|null $lastMessage
 *
 * @method static Builder<static> withUnread()
 */
#[Table('chat_conversations')]
#[Fillable(['user_id', 'manager_id', 'last_message_at'])]
class Conversation extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'manager_id' => 'integer',
            'last_message_at' => 'datetime',
        ];
    }

    public static function of(User $user): self
    {
        return self::query()->firstOrCreate(['user_id' => $user->id]);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * @return HasMany<ChatMessage, $this>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    /**
     * @return HasOne<ChatMessage, $this>
     */
    public function lastMessage(): HasOne
    {
        return $this->hasOne(ChatMessage::class)->latestOfMany();
    }

    /**
     * Unread counters for both sides: unread_for_staff (customer wrote) and unread_for_client (shop wrote).
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function withUnread(Builder $query): void
    {
        $query->withCount([
            'messages as unread_for_staff' => fn (Builder $q) => ChatMessage::whereUnread($q, fromStaff: false),
            'messages as unread_for_client' => fn (Builder $q) => ChatMessage::whereUnread($q, fromStaff: true),
        ]);
    }
}
