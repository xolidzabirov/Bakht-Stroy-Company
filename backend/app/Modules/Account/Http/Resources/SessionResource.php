<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * A logged-in device (Sanctum token).
 *
 * @mixin PersonalAccessToken
 */
final class SessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $current = $request->user()?->currentAccessToken();

        return [
            'id' => $this->id,
            /** @example Chrome Windows */
            'device' => $this->name,
            /** Это устройство, с которого сделан запрос. */
            'is_current' => $current instanceof PersonalAccessToken && $current->getKey() === $this->id,
            'last_used_at' => $this->last_used_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
        ];
    }
}
