<?php

declare(strict_types=1);

namespace App\Modules\News\Database\Seeders;

use App\Modules\Catalog\Models\Product;
use App\Modules\News\Enums\NewsType;
use App\Modules\News\Models\News;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use App\Shared\Support\UniqueSlug;
use Database\Seeders\Support\DemoImage;
use Illuminate\Database\Seeder;

/**
 * Demo news, promotions and articles with covers, galleries and linked products (not in production).
 */
class NewsSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $author = User::query()->role(Role::Admin->value)->first();

        foreach ($this->items() as $index => $item) {
            $news = News::query()->firstOrNew(['title' => $item['title']]);

            $news->fill([
                'type' => $item['type'],
                'slug' => $news->exists ? $news->slug : UniqueSlug::for(News::class, $item['title']),
                'excerpt' => $item['excerpt'],
                'body' => $item['body'],
                'video_url' => $item['video'] ?? null,
                'is_published' => true,
                'published_at' => now()->subDays($item['days_ago'])->setTime(10, 0),
                'is_pinned' => $index === 0,
                'author_id' => $author?->id,
            ])->save();

            if (! $news->hasMedia(News::COVER_COLLECTION)) {
                $news->addMedia(DemoImage::wide($item['title'], $item['type']->label(), $item['icon'], $item['palette']))
                    ->usingFileName($news->slug.'.png')
                    ->toMediaCollection(News::COVER_COLLECTION);

                foreach ($item['gallery'] as $caption) {
                    $news->addMedia(DemoImage::wide($caption, 'Bakht Stroy', $item['icon'], $item['palette']))
                        ->usingFileName($news->slug.'-'.md5($caption).'.png')
                        ->toMediaCollection(News::GALLERY_COLLECTION);
                }
            }

            $productIds = Product::query()->where('name', 'like', $item['products'])->limit(4)->pluck('id');
            $news->products()->sync($productIds->values()->mapWithKeys(fn (int $id, int $i) => [$id => ['sort_order' => $i]])->all());
        }

        $this->command?->info('NewsSeeder: '.News::query()->count().' news.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function items(): array
    {
        return [
            [
                'type' => NewsType::News, 'days_ago' => 2, 'icon' => 'blocks', 'palette' => ['#FFB800', '#B37F00'], 'products' => 'Арматура%',
                'title' => 'Bakht Stroy Company на международной выставке Taj Build',
                'excerpt' => 'Наша команда представила материалы и технику на крупнейшей строительной выставке Таджикистана.',
                'gallery' => ['Стенд Bakht Stroy на Taj Build', 'Встречи с партнёрами', 'Команда компании'],
                'body' => '<p>Компания <strong>Bakht Stroy Company</strong> приняла участие в международной строительной выставке '
                    .'<strong>Taj Build</strong> в Душанбе. На стенде мы показали строительные материалы, трубы, окна и двери, '
                    .'а также рассказали о доставке бетона собственными миксерами.</p>'
                    .'<h2>Итоги выставки</h2><ul><li>Новые договоры с производителями — цены станут ещё ниже</li>'
                    .'<li>Расширение ассортимента ЖБИ и тротуарной плитки</li><li>Специальные условия для строительных компаний</li></ul>'
                    .'<p>Спасибо всем, кто пришёл к нашему стенду!</p>',
            ],
            [
                'type' => NewsType::Promo, 'days_ago' => 4, 'icon' => 'bag', 'palette' => ['#18181B', '#3F3F46'], 'products' => 'Цемент%',
                'title' => 'Цемент «Хуаксин Гаюр» М500 — специальная цена до конца месяца',
                'excerpt' => '75 сомони за мешок вместо 82 при заказе от 20 мешков, доставка по Душанбе в день заказа.',
                'gallery' => ['Склад цемента в Душанбе'],
                'body' => '<h2>Условия акции</h2><p>До конца месяца цемент <strong>М500 Д0 «Хуаксин Гаюр»</strong> — '
                    .'<strong>75 сомони</strong> за мешок 50 кг вместо 82 сомони.</p>'
                    .'<ul><li>Минимальный заказ — 20 мешков</li><li>Доставка по Душанбе — в день заказа</li>'
                    .'<li>Бесплатная доставка от 3000 сомони</li></ul>'
                    .'<blockquote>Цемент хранится в сухом крытом складе, поэтому не слёживается и сохраняет марку.</blockquote>',
            ],
            [
                'type' => NewsType::News, 'days_ago' => 7, 'icon' => 'blocks', 'palette' => ['#FFB800', '#B37F00'], 'products' => 'Бетон М%',
                'title' => 'Бетон с доставкой: свои миксеры Хово 10 кубов',
                'excerpt' => 'Привезём бетон М150–М400 на ваш объект в Душанбе и районах, в день заказа.',
                'gallery' => ['Миксер Хово 10 кубов', 'Заливка фундамента'],
                'body' => '<p>У нас собственный парк миксеров <strong>Хово объёмом 10 м³</strong>. Бетон готовится на заводе и '
                    .'привозится на объект свежим — без потери качества.</p><h2>Как заказать</h2>'
                    .'<ol><li>Выберите марку бетона в каталоге</li><li>Укажите объём (от 3 м³) и адрес</li>'
                    .'<li>Менеджер перезвонит, уточнит время и подъезд для миксера</li></ol>'
                    .'<p>Нужен бетононасос? Скажите менеджеру — организуем.</p>',
            ],
            [
                'type' => NewsType::Promo, 'days_ago' => 10, 'icon' => 'pipe', 'palette' => ['#0E7490', '#083344'], 'products' => 'Труба П%',
                'title' => 'Пластиковые трубы с гарантией — всё в наличии',
                'excerpt' => 'ПНД и ППР трубы для воды, канализации и отопления по выгодным ценам.',
                'gallery' => ['Пластиковые трубы на складе'],
                'body' => '<p>Трубы <strong>ПНД и ППР</strong> всех диаметров — с гарантией качества. Подходят для водопровода, '
                    .'полива, канализации и отопления.</p><p>Звоните: <a href="tel:+992933116609">+992 93 311 66 09</a></p>',
            ],
            [
                'type' => NewsType::Article, 'days_ago' => 15, 'icon' => 'bricks', 'palette' => ['#3F3F46', '#18181B'], 'products' => 'Кирпич%',
                'title' => 'Как выбрать кирпич и блоки для дома',
                'excerpt' => 'Жжёный кирпич, газоблок или шлакоблок — разбираем, что лучше для стен.',
                'gallery' => [],
                'video' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'body' => '<h2>Жжёный кирпич</h2><p>Прочный и долговечный — для несущих стен и фундаментов. Марка <strong>М150</strong> '
                    .'выдерживает нагрузку дома в 2–3 этажа.</p><h2>Газоблок</h2><p>Лёгкий и тёплый, быстро кладётся на клей. '
                    .'Хорош для стен и перегородок.</p><h2>Шлакоблок</h2><p>Недорогой вариант для заборов, хозпостроек и гаражей.</p>'
                    .'<h3>Сколько кирпича нужно</h3><table><thead><tr><th>Толщина стены</th><th>Штук на 1 м²</th></tr></thead><tbody>'
                    .'<tr><td>в полкирпича (120 мм)</td><td>51</td></tr><tr><td>в кирпич (250 мм)</td><td>102</td></tr>'
                    .'<tr><td>в 1,5 кирпича (380 мм)</td><td>153</td></tr></tbody></table>',
            ],
            [
                'type' => NewsType::Article, 'days_ago' => 21, 'icon' => 'sand', 'palette' => ['#3F3F46', '#18181B'], 'products' => 'Асфальт%',
                'title' => 'Асфальтирование дворов и местных дорог',
                'excerpt' => 'Ремонт и укладка асфальта — от материалов до готового покрытия.',
                'gallery' => ['Укладка асфальта'],
                'body' => '<p>Bakht Stroy Company занимается <strong>ремонтом местных дорог</strong> и асфальтированием дворов, '
                    .'парковок и подъездных путей.</p><ul><li>Асфальт мелко- и крупнозернистый</li><li>Подготовка основания: щебень, ПГС</li>'
                    .'<li>Бордюры и водоотвод</li></ul><p>Оставьте заявку — замер и расчёт бесплатно.</p>',
            ],
        ];
    }
}
