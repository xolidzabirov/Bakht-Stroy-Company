<?php

declare(strict_types=1);

namespace App\Shared\OpenApi;

use App\Shared\Exceptions\DomainException;
use Dedoc\Scramble\Extensions\ExceptionToResponseExtension;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\Types as OpenApi;
use Dedoc\Scramble\Support\Type\ObjectType;
use Dedoc\Scramble\Support\Type\Type;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Validation\ValidationException;
use ReflectionClass;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Documents errors in the real API format (see ApiExceptionRenderer):
 * { "message": "...", "code": "...", "errors": {...} }.
 */
final class ApiErrorResponseExtension extends ExceptionToResponseExtension
{
    public function shouldHandle(Type $type): bool
    {
        return $type instanceof ObjectType && self::describe($type->name) !== null;
    }

    public function toResponse(Type $type): ?Response
    {
        if (! $type instanceof ObjectType || ! $error = self::describe($type->name)) {
            return null;
        }

        return self::response(...$error);
    }

    /**
     * @param  list<string>  $codes
     */
    public static function response(int $status, string $message, array $codes, bool $withErrors = false): Response
    {
        $body = (new OpenApi\ObjectType)
            ->addProperty('message', (new OpenApi\StringType)->example($message))
            ->addProperty('code', count($codes) > 1
                ? (new OpenApi\StringType)->enum($codes)
                : (new OpenApi\StringType)->example($codes[0]))
            ->setRequired(['message', 'code']);

        if ($withErrors) {
            $body->addProperty('errors', (new OpenApi\ObjectType)
                ->setDescription('Ошибки по полям: { "поле": ["сообщение", ...] }')
                ->additionalProperties((new OpenApi\ArrayType)->setItems(new OpenApi\StringType)));
            $body->setRequired(['message', 'code', 'errors']);
        }

        return Response::make($status)
            ->setDescription($message.' ('.implode(', ', $codes).')')
            ->setContent('application/json', Schema::fromType($body));
    }

    /**
     * @param  class-string|string  $class
     * @return array{status: int, message: string, codes: list<string>, withErrors?: bool}|null
     */
    public static function describe(string $class): ?array
    {
        if (! class_exists($class)) {
            return null;
        }

        return match (true) {
            is_a($class, DomainException::class, true) => self::describeDomainException($class),
            is_a($class, ValidationException::class, true) => ['status' => 422, 'message' => 'Переданные данные некорректны.', 'codes' => ['VALIDATION_ERROR'], 'withErrors' => true],
            is_a($class, AuthenticationException::class, true) => ['status' => 401, 'message' => 'Требуется авторизация.', 'codes' => ['UNAUTHENTICATED']],
            is_a($class, AuthorizationException::class, true),
            is_a($class, AccessDeniedHttpException::class, true) => ['status' => 403, 'message' => 'Недостаточно прав.', 'codes' => ['FORBIDDEN']],
            is_a($class, ModelNotFoundException::class, true),
            is_a($class, NotFoundHttpException::class, true) => ['status' => 404, 'message' => 'Ресурс не найден.', 'codes' => ['NOT_FOUND']],
            is_a($class, ThrottleRequestsException::class, true) => ['status' => 429, 'message' => 'Слишком много запросов. Попробуйте позже.', 'codes' => ['TOO_MANY_REQUESTS']],
            default => null,
        };
    }

    /**
     * Domain exceptions in modules have no-argument constructors, so they can be
     * instantiated to read their real status, code and message.
     *
     * @param  class-string<DomainException>  $class
     * @return array{status: int, message: string, codes: list<string>}|null
     */
    private static function describeDomainException(string $class): ?array
    {
        $reflection = new ReflectionClass($class);

        if ($reflection->isAbstract() || ($reflection->getConstructor()?->getNumberOfRequiredParameters() ?? 0) > 0) {
            return null;
        }

        /** @var DomainException $exception */
        $exception = $reflection->newInstance();

        return ['status' => $exception->status, 'message' => $exception->getMessage(), 'codes' => [$exception->errorCode]];
    }
}
