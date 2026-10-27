<?php

declare(strict_types=1);

namespace App\Modules\User\Http\Resources;

use App\Modules\User\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
final class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            /** @example client@gmail.com */
            'email' => $this->email,
            /** @example +992931234567 */
            'phone' => $this->phone,
            /** @example ru */
            'locale' => $this->locale,
            /** @example system */
            'theme' => $this->theme,
            /**
             * Роль пользователя: client (покупатель) или admin.
             *
             * @var list<string>
             */
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values()->all()),
            'is_staff' => $this->whenLoaded('roles', fn () => $this->isStaff()),
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
