<?php

declare(strict_types=1);

namespace App\Shared\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

/**
 * Renders every API error in one format:
 * { "message": "...", "code": "SOME_CODE", "errors": { ... } }.
 */
final class ApiExceptionRenderer
{
    public static function register(Exceptions $exceptions): void
    {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (Throwable $e, Request $request): ?JsonResponse {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            return self::render($e);
        });
    }

    private static function render(Throwable $e): ?JsonResponse
    {
        return match (true) {
            $e instanceof DomainException => self::json($e->getMessage(), $e->errorCode, $e->status, details: $e->details),
            $e instanceof ValidationException => self::json(
                __('Переданные данные некорректны.'),
                'VALIDATION_ERROR',
                $e->status,
                $e->errors(),
            ),
            $e instanceof AuthenticationException => self::json(__('Требуется авторизация.'), 'UNAUTHENTICATED', 401),
            $e instanceof AuthorizationException,
            $e instanceof AccessDeniedHttpException => self::json(__('Недостаточно прав.'), 'FORBIDDEN', 403),
            $e instanceof ModelNotFoundException,
            $e instanceof NotFoundHttpException => self::json(__('Ресурс не найден.'), 'NOT_FOUND', 404),
            $e instanceof ThrottleRequestsException => self::json(
                __('Слишком много запросов. Попробуйте позже.'),
                'TOO_MANY_REQUESTS',
                429,
                headers: $e->getHeaders(),
            ),
            // e.g. spatie "role:admin" middleware throws a 403 HttpException.
            $e instanceof HttpExceptionInterface && $e->getStatusCode() === 403 => self::json(
                __('Недостаточно прав.'),
                'FORBIDDEN',
                403,
            ),
            $e instanceof HttpExceptionInterface && $e->getStatusCode() === 405 => self::json(
                __('Метод не поддерживается.'),
                'METHOD_NOT_ALLOWED',
                405,
                headers: $e->getHeaders(),
            ),
            $e instanceof HttpExceptionInterface => self::json(
                $e->getMessage() !== '' ? $e->getMessage() : __('Ошибка запроса.'),
                'HTTP_ERROR',
                $e->getStatusCode(),
                headers: $e->getHeaders(),
            ),
            // In debug mode let Laravel show the full stack trace.
            config('app.debug') => null,
            default => self::json(__('Внутренняя ошибка сервера.'), 'SERVER_ERROR', 500),
        };
    }

    /**
     * @param  array<string, array<int, string>>|null  $errors
     * @param  array<string, string>  $headers
     * @param  array<int|string, mixed>  $details
     */
    private static function json(string $message, string $code, int $status, ?array $errors = null, array $headers = [], array $details = []): JsonResponse
    {
        $body = ['message' => $message, 'code' => $code];

        if ($errors !== null) {
            $body['errors'] = $errors;
        }

        if ($details !== []) {
            $body['details'] = $details;
        }

        return new JsonResponse($body, $status, $headers);
    }
}
