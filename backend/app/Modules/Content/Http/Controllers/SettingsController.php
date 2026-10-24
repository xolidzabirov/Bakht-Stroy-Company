<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Controllers;

use App\Modules\Content\Http\Requests\UpdateSettingsRequest;
use App\Modules\Content\Support\DatabaseShopSettings;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

final class SettingsController extends Controller
{
    public function __construct(private DatabaseShopSettings $settings) {}

    /**
     * Контакты и условия доставки
     *
     * Для шапки, подвала, страниц «Контакты» и «Доставка». Доступно гостям.
     */
    #[Group('Магазин', weight: 8)]
    public function public(): JsonResponse
    {
        return response()->json(['data' => $this->all()]);
    }

    /**
     * Настройки магазина
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->all()]);
    }

    /**
     * Изменить настройки
     *
     * Только администратор. Можно передать любую часть: { "delivery": { "price": 60000 } }.
     * Новые цены доставки сразу применяются при оформлении заказов.
     */
    #[Group('Админ: настройки и контент', weight: 15)]
    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        foreach (DatabaseShopSettings::GROUPS as $group) {
            if ($request->has($group)) {
                /** @var array<string, mixed> $changes */
                $changes = $request->validated($group);
                $this->settings->update($group, $changes);
            }
        }

        return response()->json(['data' => $this->all()]);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function all(): array
    {
        return collect(DatabaseShopSettings::GROUPS)->mapWithKeys(fn (string $group) => [$group => $this->settings->get($group)])->all();
    }
}
