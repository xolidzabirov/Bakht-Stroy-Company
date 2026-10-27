<?php

declare(strict_types=1);

namespace App\Modules\Chat\Providers;

use App\Modules\Chat\Models\ChatMessage;
use App\Modules\Chat\Support\ChatMediaPathGenerator;
use App\Shared\Providers\ModuleServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\RateLimiter;

final class ChatServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        // Private channel auth for the WebSocket: POST /api/v1/broadcasting/auth with the Sanctum token.
        Broadcast::routes(['prefix' => self::API_PREFIX, 'middleware' => ['api', 'auth:sanctum', 'active']]);
        require $this->modulePath().'/channels.php';

        config(['media-library.custom_path_generators' => [
            ...(array) config('media-library.custom_path_generators', []),
            ChatMessage::class => ChatMediaPathGenerator::class,
        ]]);

        // A person types quickly, but not 30 messages a minute.
        RateLimiter::for('chat-send', fn (Request $request) => Limit::perMinute(30)
            ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
