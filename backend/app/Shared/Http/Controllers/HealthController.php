<?php

declare(strict_types=1);

namespace App\Shared\Http\Controllers;

use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

#[Group('Система', weight: 100)]
final class HealthController extends Controller
{
    /**
     * Проверка API
     *
     * Статус API, версия и время сервера. Проверяет подключение к базе данных.
     */
    public function __invoke(): JsonResponse
    {
        DB::select('select 1');

        return response()->json([
            'data' => [
                /** @example ok */
                'status' => 'ok',
                /** @example 1.0.0 */
                'version' => config('scramble.info.version'),
                'time' => now()->toIso8601String(),
            ],
        ]);
    }
}
