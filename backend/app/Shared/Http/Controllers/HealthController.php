<?php

declare(strict_types=1);

namespace App\Shared\Http\Controllers;

use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

#[Group('Система', weight: 100)]
final class HealthController extends Controller
{
    /**
     * Проверка API
     *
     * Состояние базы данных, кэша, хранилища файлов и очереди. 200 — всё работает, 503 — есть проблема
     * (для мониторинга сервера).
     */
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->check(fn () => DB::select('select 1')),
            'cache' => $this->check(function (): void {
                $key = 'health:'.Str::random(8);
                Cache::put($key, 'ok', 10);
                throw_unless(Cache::pull($key) === 'ok', new \RuntimeException('cache read failed'));
            }),
            'storage' => $this->check(function (): void {
                $path = 'health/'.Str::random(8).'.txt';
                Storage::disk('public')->put($path, 'ok');
                Storage::disk('public')->delete($path);
            }),
        ];

        $healthy = ! in_array(false, $checks, true);

        return response()->json([
            'data' => [
                /** ok или degraded. */
                'status' => $healthy ? 'ok' : 'degraded',
                /** @example 1.0.0 */
                'version' => config('scramble.info.version'),
                'time' => now()->toIso8601String(),
                /** true — работает. */
                'checks' => $checks,
                'queue' => [
                    'connection' => config('queue.default'),
                    /** Задачи, упавшие с ошибкой (письма и уведомления). */
                    'failed_jobs' => $this->safeCount('failed_jobs'),
                ],
            ],
        ], $healthy ? 200 : 503);
    }

    private function check(callable $probe): bool
    {
        try {
            $probe();

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    private function safeCount(string $table): ?int
    {
        try {
            return DB::table($table)->count();
        } catch (Throwable) {
            return null;
        }
    }
}
