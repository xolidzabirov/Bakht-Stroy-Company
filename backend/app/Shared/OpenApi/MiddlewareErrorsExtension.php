<?php

declare(strict_types=1);

namespace App\Shared\OpenApi;

use App\Modules\User\Exceptions\AccountBlockedException;
use Dedoc\Scramble\Extensions\OperationExtension;
use Dedoc\Scramble\Support\Generator\Operation;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\RouteInfo;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Adds error responses produced by route middleware, which Scramble cannot infer
 * from the controller code: throttle (429), role/permission (403) and the aliases
 * listed in config('scramble.middleware_errors') (e.g. active => AccountBlockedException).
 */
final class MiddlewareErrorsExtension extends OperationExtension
{
    public function handle(Operation $operation, RouteInfo $routeInfo): void
    {
        $middleware = collect($routeInfo->route->gatherMiddleware())->filter(fn ($m) => is_string($m));

        $exceptions = array_filter([
            $middleware->contains(fn (string $m) => Str::startsWith($m, 'throttle')) ? ThrottleRequestsException::class : null,
            $middleware->contains(fn (string $m) => Str::startsWith($m, ['role:', 'permission:'])) ? AccessDeniedHttpException::class : null,
        ]);

        /** @var array<string, class-string> $aliasErrors */
        $aliasErrors = config('scramble.middleware_errors', []);

        foreach ($aliasErrors as $alias => $exception) {
            if ($middleware->contains($alias)) {
                $exceptions[] = $exception;
            }
        }

        $errorsByStatus = collect($exceptions)
            ->map(fn (string $class) => ApiErrorResponseExtension::describe($class))
            ->filter()
            ->groupBy('status');

        foreach ($errorsByStatus as $status => $errors) {
            $existing = collect($operation->responses)->first(
                fn ($response) => $response instanceof Response && $response->code === $status,
            );

            $codes = $errors->pluck('codes')->flatten()->unique()->values()->all();
            $message = $errors->pluck('message')->implode(' / ');

            if ($existing instanceof Response) {
                // Merge with an error the controller already declares for the same status.
                $codes = array_values(array_unique([...$this->codesOf($existing), ...$codes]));
                $operation->responses = array_values(array_filter(
                    $operation->responses,
                    fn ($response) => $response !== $existing,
                ));
                $message = ($existing->description ? Str::before($existing->description, ' (') : '').' / '.$message;
            }

            $operation->addResponse(ApiErrorResponseExtension::response((int) $status, $message, $codes));
        }
    }

    /**
     * @return list<string>
     */
    private function codesOf(Response $response): array
    {
        $description = (string) $response->description;

        if (! preg_match('/\(([A-Z_, ]+)\)$/', $description, $matches)) {
            return [];
        }

        return array_map('trim', explode(',', $matches[1]));
    }
}
