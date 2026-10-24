<?php

declare(strict_types=1);

namespace App\Modules\Content\Database\Seeders;

use App\Modules\Content\Models\Banner;
use App\Modules\Content\Support\DatabaseShopSettings;
use Database\Seeders\Support\DemoImage;
use Illuminate\Database\Seeder;

/**
 * Demo store contacts and home page banners (not in production).
 */
class ContentSeeder extends Seeder
{
    public function run(DatabaseShopSettings $settings): void
    {
        if (app()->isProduction()) {
            return;
        }

        $settings->update('store', [
            'name' => 'Bakht Stroy',
            'phones' => ['+998901234567', '+998712000000'],
            'email' => 'info@bakhtstroy.uz',
            'address' => 'Ташкент, Сергелийский район, ул. Янги Сергели, 15',
            'work_hours' => 'Пн–Сб 08:00–19:00, Вс 09:00–15:00',
            'map' => ['lat' => 41.2280, 'lng' => 69.2190],
            'socials' => ['instagram' => 'https://www.instagram.com/bakhtstroycompany', 'telegram' => 'https://t.me/bakhtstroy'],
        ]);

        $settings->update('delivery', [
            'pickup_address' => 'Склад: Ташкент, ул. Янги Сергели, 15',
            'note' => 'Доставка по Ташкенту — в течение дня после подтверждения, по области — на следующий день. Разгрузка манипулятором.',
        ]);

        $banners = [
            ['Скидка до 10% на цемент М500', 'Кызылкумцемент и Ахангаранцемент со склада в Ташкенте', 'Купить цемент', '/catalog/tsement', 'bag', ['#F26B1D', '#B4440E']],
            ['Газоблоки с доставкой на следующий день', 'Новый склад в Чирчике — D500 и D600 всегда в наличии', 'Смотреть блоки', '/catalog/gazobloki-i-penobloki', 'blocks', ['#475569', '#1E293B']],
            ['Сезон кровли: −15% на профнастил', 'Бесплатный расчёт материалов по размерам крыши', 'Подробнее', '/news', 'roof', ['#15803D', '#14532D']],
        ];

        foreach ($banners as $sort => [$title, $subtitle, $button, $link, $icon, $palette]) {
            $banner = Banner::query()->updateOrCreate(
                ['title' => $title],
                ['subtitle' => $subtitle, 'button_text' => $button, 'link' => $link, 'sort_order' => $sort, 'is_active' => true],
            );

            if (! $banner->hasMedia(Banner::IMAGE_COLLECTION)) {
                $banner->addMedia(DemoImage::wide($title, $subtitle, $icon, $palette, 1920, 600))
                    ->usingFileName("banner-{$banner->id}.png")
                    ->toMediaCollection(Banner::IMAGE_COLLECTION);
            }
        }

        $this->command?->info('ContentSeeder: store settings and '.count($banners).' banners.');
    }
}
