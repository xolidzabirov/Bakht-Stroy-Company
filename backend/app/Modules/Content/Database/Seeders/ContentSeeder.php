<?php

declare(strict_types=1);

namespace App\Modules\Content\Database\Seeders;

use App\Modules\Content\Models\Banner;
use App\Modules\Content\Support\DatabaseShopSettings;
use Database\Seeders\Support\DemoImage;
use Illuminate\Database\Seeder;

/**
 * Store contacts of Bakht Stroy Company (Dushanbe) and home page banners (not in production).
 */
class ContentSeeder extends Seeder
{
    public function run(DatabaseShopSettings $settings): void
    {
        if (app()->isProduction()) {
            return;
        }

        $settings->update('store', [
            'name' => 'Bakht Stroy Company',
            'description' => 'Таъмини ҳама намудҳои масолеҳи сохтмонӣ ва таъмири роҳҳои маҳаллӣ — все виды строительных материалов и ремонт местных дорог.',
            'phones' => ['+992907666609', '+992929666609', '+992306666609'],
            'email' => 'bahktstroy90@gmail.com',
            'address' => 'Душанбе, ул. Джабор Расулов',
            'work_hours' => 'Пн–Сб 08:00–17:30, Вс — выходной',
            'map' => ['lat' => 38.5737, 'lng' => 68.7738],
            'socials' => [
                'instagram' => 'https://www.instagram.com/bakht_stroy_company',
                'telegram' => 'https://t.me/bakht_stroy_dushanbe',
                'telegram_chat' => 'https://t.me/bakhtsroy01',
                'whatsapp' => 'https://wa.me/992907666609',
            ],
        ]);

        $settings->update('delivery', [
            'price' => 5000,
            'free_from' => 300000,
            'pickup_address' => 'Склад: Душанбе, ул. Джабор Расулов',
            'note' => 'Доставка по Душанбе — в день подтверждения заказа, по районам (Вахдат, Гиссар, Рудаки, Турсунзаде) — на следующий день. '
                .'Бетон привозим своими миксерами (10 м³), тяжёлые грузы — КамАЗом или манипулятором с разгрузкой.',
        ]);

        $settings->update('payment', [
            'note' => 'Заказ оплачивается до доставки: наличными в офисе (ул. Джабор Расулов) или переводом на карту, юрлица — безналичным расчётом. '
                .'После перевода отправьте чек менеджеру в WhatsApp или Telegram — он проверит поступление и отправит заказ.',
        ]);

        $banners = [
            ['Цемент «Хуаксин Гаюр» М500 со скидкой', 'Оптом и в розницу со склада в Душанбе', 'Купить цемент', '/catalog/tsement-i-suhie-smesi', 'bag', ['#18181B', '#3F3F46']],
            ['Бетон с доставкой своими миксерами', 'М150–М400, миксеры 10 м³ — привезём на объект в день заказа', 'Заказать бетон', '/catalog/tovarnyi-beton-i-rastvor', 'blocks', ['#FFB800', '#B37F00']],
            ['Пластиковые трубы с гарантией', 'ПНД и ППР для воды и канализации — всё в наличии', 'Смотреть трубы', '/catalog/plastikovye-truby', 'pipe', ['#0E7490', '#083344']],
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

        $this->command?->info('ContentSeeder: store contacts and '.count($banners).' banners.');
    }
}
