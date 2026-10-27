<?php

declare(strict_types=1);

namespace App\Modules\Chat\Support;

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Carbon;

/**
 * "Online" / "last seen": every chat request stamps users.last_seen_at;
 * someone seen within the last two minutes is online.
 */
final class Presence
{
    public const ONLINE_SECONDS = 120;

    /** Do not write to the database more often than this. */
    private const TOUCH_EVERY_SECONDS = 30;

    public static function touch(User $user): void
    {
        $seen = $user->last_seen_at;

        if ($seen === null || $seen->lt(now()->subSeconds(self::TOUCH_EVERY_SECONDS))) {
            $user->forceFill(['last_seen_at' => now()])->saveQuietly();
        }
    }

    public static function isOnline(?Carbon $seen): bool
    {
        return $seen !== null && $seen->gte(now()->subSeconds(self::ONLINE_SECONDS));
    }

    /**
     * When the shop team was last active (the customer sees "online" if anyone is at work).
     */
    public static function staffLastSeen(): ?Carbon
    {
        $value = User::query()->role(array_map(fn (Role $role) => $role->value, Role::staff()))->max('last_seen_at');

        return $value === null ? null : Carbon::parse($value);
    }
}
