<?php

declare(strict_types=1);

namespace App\Modules\Order\Providers;

use App\Modules\Order\Events\OrderPlaced;
use App\Modules\Order\Events\OrderStatusChanged;
use App\Modules\Order\Listeners\LogOrderEvents;
use App\Modules\Order\Listeners\SendOrderNotifications;
use App\Shared\Providers\ModuleServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;

final class OrderServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Event::listen(OrderPlaced::class, [SendOrderNotifications::class, 'orderPlaced']);
        Event::listen(OrderStatusChanged::class, [SendOrderNotifications::class, 'statusChanged']);
        Event::listen(OrderPlaced::class, [LogOrderEvents::class, 'orderPlaced']);
        Event::listen(OrderStatusChanged::class, [LogOrderEvents::class, 'statusChanged']);

        // Protection from accidental double clicks and scripts: 10 orders per hour per user.
        RateLimiter::for('orders', fn (Request $request) => Limit::perHour(10)->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
