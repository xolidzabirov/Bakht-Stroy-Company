<?php

declare(strict_types=1);

namespace App\Modules\Chat\Models;

use App\Modules\Catalog\Models\Product;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * A chat message: text, files, a quoted message, a product card or an order link.
 * Deleted messages keep their place in the history ("Сообщение удалено") but lose the content.
 *
 * @property int $id
 * @property int $conversation_id
 * @property int|null $sender_id
 * @property bool $from_staff
 * @property string|null $body
 * @property int|null $reply_to_id
 * @property int|null $product_id
 * @property int|null $order_id
 * @property Carbon|null $read_at
 * @property Carbon|null $edited_at
 * @property Carbon|null $deleted_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Conversation $conversation
 * @property-read User|null $sender
 * @property-read ChatMessage|null $replyTo
 * @property-read Product|null $product
 * @property-read Order|null $order
 *
 * @method static Builder<static> unread(bool $fromStaff)
 */
#[Table('chat_messages')]
#[Fillable(['conversation_id', 'sender_id', 'from_staff', 'body', 'reply_to_id', 'product_id', 'order_id'])]
class ChatMessage extends Model implements HasMedia
{
    use InteractsWithMedia;

    public const ATTACHMENTS = 'attachments';

    /** Own messages can be edited for this long. */
    public const EDIT_WINDOW_HOURS = 48;

    /** Everything ChatMessageResource reads (strict mode forbids lazy loading). */
    public const RELATIONS = ['media', 'sender', 'replyTo.media', 'product.media', 'order'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'conversation_id' => 'integer',
            'sender_id' => 'integer',
            'from_staff' => 'boolean',
            'read_at' => 'datetime',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::ATTACHMENTS);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        // Only photos get a preview; documents are shown as file cards.
        if ($media !== null && ! str_starts_with($media->mime_type, 'image/')) {
            return;
        }

        // Made right away: the preview must exist when the message reaches the other side.
        $this->addMediaConversion('thumb')->nonQueued()->nonOptimized()->fit(Fit::Max, 640, 640)->format('webp');
    }

    /**
     * Not yet read by the other side (also used inside withCount closures).
     *
     * @param  Builder<self>  $query
     */
    public static function whereUnread(Builder $query, bool $fromStaff): void
    {
        $query->where('from_staff', $fromStaff)->whereNull('read_at')->whereNull('deleted_at');
    }

    /**
     * @return BelongsTo<Conversation, $this>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id')->withTrashed();
    }

    /**
     * @return BelongsTo<ChatMessage, $this>
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isDeleted(): bool
    {
        return $this->deleted_at !== null;
    }

    /**
     * Not yet read by the other side.
     *
     * @param  Builder<self>  $query
     */
    #[Scope]
    protected function unread(Builder $query, bool $fromStaff): void
    {
        self::whereUnread($query, $fromStaff);
    }
}
