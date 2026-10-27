<?php

declare(strict_types=1);

namespace App\Modules\Chat\Support;

use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Sends chat events to the WebSocket server right away. If Reverb is down the message is still saved:
 * the site notices the lost connection and loads new messages by polling.
 */
final class ChatBroadcaster
{
    public function __construct(private readonly BroadcastManager $broadcast) {}

    public function send(ShouldBroadcastNow $event): void
    {
        try {
            $this->broadcast->queue($event);
        } catch (Throwable $exception) {
            Log::warning('Chat event was not broadcast: '.$exception->getMessage(), ['event' => $event::class]);
        }
    }
}
