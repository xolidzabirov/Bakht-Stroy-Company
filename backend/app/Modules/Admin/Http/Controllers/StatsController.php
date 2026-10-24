<?php

declare(strict_types=1);

namespace App\Modules\Admin\Http\Controllers;

use App\Modules\Admin\Actions\GetStats;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\QueryParameter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Админ: статистика', weight: 9)]
final class StatsController extends Controller
{
    /**
     * Статистика для дашборда
     *
     * Пользователи (всего зарегистрировано, новые за сегодня / 7 / 30 дней), заказы по статусам,
     * выручка и средний чек, топ-10 товаров, состояние каталога и графики по дням.
     */
    #[QueryParameter('period', description: 'Период в днях: 7, 30 или 90', type: 'int', default: 30, example: 30)]
    public function __invoke(Request $request, GetStats $stats): JsonResponse
    {
        $request->validate(['period' => ['nullable', 'integer', 'in:7,30,90']]);

        return response()->json(['data' => $stats->handle($request->integer('period', 30))]);
    }
}
