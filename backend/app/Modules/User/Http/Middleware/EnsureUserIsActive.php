<?php

declare(strict_types=1);

namespace App\Modules\User\Http\Middleware;

use App\Modules\User\Exceptions\AccountBlockedException;
use App\Modules\User\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rejects requests of blocked users (alias: "active"). Use after auth:sanctum.
 */
final class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isBlocked()) {
            $user->tokens()->delete();

            throw new AccountBlockedException;
        }

        return $next($request);
    }
}
