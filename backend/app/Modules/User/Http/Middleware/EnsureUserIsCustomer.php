<?php

declare(strict_types=1);

namespace App\Modules\User\Http\Middleware;

use App\Modules\User\Exceptions\StaffCannotShopException;
use App\Modules\User\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cart, favorites and placing orders are for customers only (alias: "customer"):
 * administrators and managers work with orders in the admin panel. Use after auth:sanctum.
 */
final class EnsureUserIsCustomer
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isStaff()) {
            throw new StaffCannotShopException;
        }

        return $next($request);
    }
}
