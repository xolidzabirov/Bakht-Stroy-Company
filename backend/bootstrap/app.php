<?php

use App\Modules\User\Http\Middleware\EnsureUserIsActive;
use App\Shared\Exceptions\ApiExceptionRenderer;
use App\Shared\Http\Middleware\JsonApi;
use App\Shared\Http\Middleware\RequestContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api/v1',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend([RequestContext::class, JsonApi::class]);

        // The Next.js server (BFF) calls the API for the browser and passes the client IP in X-Forwarded-For.
        // Only these addresses are trusted, so rate limits count real visitors.
        $middleware->trustProxies(at: array_values(array_filter(explode(',', (string) env('TRUSTED_PROXIES', '127.0.0.1,::1')))));

        // Overall limit for every API route (per user or IP), see AppServiceProvider.
        $middleware->api(append: ['throttle:api']);

        $middleware->alias([
            'active' => EnsureUserIsActive::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        ApiExceptionRenderer::register($exceptions);
    })->create();
