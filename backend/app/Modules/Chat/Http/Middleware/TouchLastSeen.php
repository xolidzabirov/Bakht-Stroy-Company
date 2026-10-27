<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Middleware;

use App\Modules\Chat\Support\Presence;
use App\Modules\User\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Chat requests count as activity: the other side sees "online" / "был(а) в сети …".
 */
final class TouchLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User) {
            Presence::touch($user);
        }

        return $next($request);
    }
}
