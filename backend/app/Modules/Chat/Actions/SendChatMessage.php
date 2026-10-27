<?php

declare(strict_types=1);

namespace App\Modules\Chat\Actions;

use App\Modules\Chat\Events\ChatMessageChanged;
use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Models\Conversation;
use App\Modules\Chat\Support\ChatBroadcaster;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

use function Illuminate\Support\defer;

/**
 * Saves a message (text, files, quote, product card, order link) and delivers it live.
 * The first staff reply makes that person the conversation's manager.
 */
final class SendChatMessage
{
    public function __construct(
        private readonly ChatBroadcaster $broadcaster,
        private readonly NotifyStaffAboutMessage $notifyStaff,
    ) {}

    /**
     * @param  array{body?: string|null, reply_to_id?: int|null, product_id?: int|null, order_number?: string|null}  $data
     * @param  list<UploadedFile>  $files
     */
    public function handle(Conversation $conversation, User $sender, bool $asStaff, array $data, array $files = []): ChatMessage
    {
        $replyToId = $data['reply_to_id'] ?? null;

        if ($replyToId !== null && ! $conversation->messages()->whereKey($replyToId)->exists()) {
            throw ValidationException::withMessages(['reply_to_id' => 'Сообщение для ответа не найдено.']);
        }

        $orderId = null;

        if (($data['order_number'] ?? null) !== null) {
            // Only the customer's own orders can be linked — by either side.
            $orderId = Order::query()->where('number', $data['order_number'])->where('user_id', $conversation->user_id)->value('id');

            if ($orderId === null) {
                throw ValidationException::withMessages(['order_number' => 'Заказ не найден.']);
            }
        }

        $body = trim((string) ($data['body'] ?? ''));

        $message = DB::transaction(function () use ($conversation, $sender, $asStaff, $body, $replyToId, $orderId, $data, $files): ChatMessage {
            $message = $conversation->messages()->create([
                'sender_id' => $sender->id,
                'from_staff' => $asStaff,
                'body' => $body === '' ? null : $body,
                'reply_to_id' => $replyToId,
                'product_id' => $data['product_id'] ?? null,
                'order_id' => $orderId,
            ]);

            foreach ($files as $file) {
                $message->addMedia($file)
                    ->usingName(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
                    ->usingFileName(self::safeFileName($file))
                    ->toMediaCollection(ChatMessage::ATTACHMENTS);
            }

            $conversation->forceFill([
                'last_message_at' => $message->created_at,
                'manager_id' => $asStaff ? ($conversation->manager_id ?? $sender->id) : $conversation->manager_id,
            ])->save();

            return $message;
        });

        $message->load(ChatMessage::RELATIONS);
        $this->broadcaster->send(new ChatMessageChanged($message, created: true));

        if (! $asStaff) {
            $messageId = $message->id;
            defer(fn () => $this->notifyStaff->handle($messageId));
        }

        return $message;
    }

    /**
     * Keeps the visible name readable ("Смета объекта.pdf") but safe for the disk.
     */
    private static function safeFileName(UploadedFile $file): string
    {
        $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $name = (string) preg_replace('/[^\p{L}\p{N}._-]+/u', '-', $name);
        $name = trim(mb_substr($name, 0, 80), '-.') ?: 'file';
        $extension = strtolower($file->getClientOriginalExtension() ?: (string) $file->extension());

        return $extension === '' ? $name : "{$name}.{$extension}";
    }
}
