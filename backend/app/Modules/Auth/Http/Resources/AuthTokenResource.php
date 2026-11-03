<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Resources;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\User\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property AuthResult $resource
 */
final class AuthTokenResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user' => UserResource::make($this->resource->user),
            /**
             * Передавайте в заголовке: Authorization: Bearer {token}.
             *
             * @example 1|hS8vQm2kZ0pX9yJcT4wLr7NbE5aU3fGd6iKoY1qW
             */
            'token' => $this->resource->token,
            /** @example Bearer */
            'token_type' => 'Bearer',
            'expires_at' => $this->resource->expiresAt?->toIso8601String(),
            /**
             * Когда token заканчивается, POST /auth/refresh с этим значением даёт новую пару без повторного входа.
             *
             * @example 1|Qm2kZ0pX9yJcT4wLr7NbE5aU3fGd6iKoY1qWhS8vQm2kZ0pX9yJcT4wLr7NbE5aU
             */
            'refresh_token' => $this->resource->refreshToken,
            'refresh_expires_at' => $this->resource->refreshExpiresAt->toIso8601String(),
        ];
    }
}
