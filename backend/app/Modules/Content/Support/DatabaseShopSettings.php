<?php

declare(strict_types=1);

namespace App\Modules\Content\Support;

use App\Shared\Contracts\ShopSettings;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Settings stored in the `settings` table (one JSON row per group), cached forever
 * and dropped from the cache on every save. Missing keys come from defaults().
 */
final class DatabaseShopSettings implements ShopSettings
{
    public const GROUPS = ['store', 'delivery', 'payment'];

    private const CACHE_KEY = 'shop_settings';

    public function get(string $group): array
    {
        /** @var array<string, array<string, mixed>> $stored */
        $stored = Cache::rememberForever(self::CACHE_KEY, fn () => DB::table('settings')->pluck('value', 'group')
            ->map(fn ($value) => json_decode((string) $value, true) ?: [])
            ->all());

        return array_replace_recursive(self::defaults()[$group] ?? [], $stored[$group] ?? []);
    }

    /**
     * Merges changes into a group (lists such as phones are replaced, not merged).
     *
     * @param  array<string, mixed>  $changes
     * @return array<string, mixed>
     */
    public function update(string $group, array $changes): array
    {
        $current = $this->get($group);

        foreach (Arr::dot($changes) as $key => $value) {
            Arr::set($current, (string) $key, $value);
        }

        // Lists come as a whole.
        foreach ($changes as $key => $value) {
            if (is_array($value) && array_is_list($value)) {
                $current[$key] = $value;
            }
        }

        DB::table('settings')->upsert(
            ['group' => $group, 'value' => json_encode($current, JSON_UNESCAPED_UNICODE), 'updated_at' => now()],
            ['group'],
            ['value', 'updated_at'],
        );

        Cache::forget(self::CACHE_KEY);

        return $this->get($group);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function defaults(): array
    {
        return [
            'store' => [
                'name' => 'Bakht Stroy Company',
                'description' => 'Интернет-магазин строительных материалов',
                'phones' => [],
                'email' => null,
                'address' => null,
                'work_hours' => 'Пн–Сб 08:00–19:00, Вс — выходной',
                'map' => ['lat' => null, 'lng' => null],
                'socials' => ['telegram' => null, 'instagram' => null, 'whatsapp' => null, 'facebook' => null, 'youtube' => null],
            ],
            'delivery' => [
                'price' => (int) config('shop.delivery.price'),
                'free_from' => (int) config('shop.delivery.free_from'),
                'pickup_address' => null,
                'note' => 'Доставка по городу в течение 1–2 дней после подтверждения заказа.',
            ],
            // Card details shown to clients who choose "transfer to card".
            'payment' => [
                'card_number' => null,
                'card_holder' => null,
                'bank' => null,
                'note' => 'После перевода отправьте чек менеджеру в WhatsApp или Telegram — мы подтвердим оплату.',
            ],
        ];
    }
}
