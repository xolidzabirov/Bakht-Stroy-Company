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
                'type' => NewsType::Promo, 'days_ago' => 1, 'icon' => 'bag', 'palette' => ['#F26B1D', '#B4440E'], 'products' => 'Цемент%',
                'title' => 'Скидка до 10% на цемент М500 до конца месяца',
                'excerpt' => 'Цемент Кызылкумцемент и Ахангаранцемент по специальной цене при заказе от 20 мешков.',
                'gallery' => ['Склад цемента в Сергели', 'Погрузка цемента'],
                'body' => '<h2>Условия акции</h2><p>До конца месяца цемент марки <strong>М500</strong> продаётся со скидкой до 10%. '
                    .'Скидка действует при заказе от 20 мешков на один адрес доставки.</p>'
                    .'<ul><li>Кызылкумцемент М500 Д0 — 69 000 сум вместо 75 000 сум</li><li>Ахангаранцемент М400 Д20 — 58 000 сум</li>'
                    .'<li>Бесплатная доставка от 3 000 000 сум</li></ul>'
                    .'<blockquote>Цемент хранится в сухом крытом складе, поэтому не слёживается и сохраняет марку.</blockquote>'
                    .'<p>Оформите заказ на сайте или позвоните нам — менеджер подберёт количество под ваш объём работ.</p>',
            ],
            [
                'type' => NewsType::News, 'days_ago' => 4, 'icon' => 'blocks', 'palette' => ['#475569', '#1E293B'], 'products' => 'Газоблок%',
                'title' => 'Открыли новый склад газоблоков в Чирчике',
                'excerpt' => 'Теперь газоблоки и пеноблоки доставляем по Ташкентской области на следующий день.',
                'gallery' => ['Новый склад в Чирчике', 'Газоблоки на поддонах', 'Разгрузка манипулятором'],
                'body' => '<p>Мы открыли второй склад площадью <strong>2 500 м²</strong> в Чирчике. На складе всегда в наличии '
                    .'газоблоки D500 и D600, перегородочные блоки и клей для кладки.</p><h2>Что это значит для вас</h2>'
                    .'<ol><li>Доставка по Ташкентской области — на следующий день</li><li>Самовывоз с двух складов</li>'
                    .'<li>Разгрузка манипулятором прямо на объекте</li></ol>',
            ],
            [
                'type' => NewsType::Article, 'days_ago' => 8, 'icon' => 'bricks', 'palette' => ['#C2410C', '#7C2D12'], 'products' => 'Кирпич%',
                'title' => 'Как выбрать кирпич для дома: полнотелый, пустотелый или облицовочный',
                'excerpt' => 'Разбираем марки прочности, пустотность и где какой кирпич использовать.',
                'gallery' => ['Полнотелый и пустотелый кирпич'],
                'video' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'body' => '<h2>Полнотелый кирпич</h2><p>Подходит для несущих стен, фундаментов и цоколя. Марка <strong>М150</strong> '
                    .'выдерживает нагрузку частного дома в 2–3 этажа.</p><h2>Пустотелый кирпич</h2><p>Легче на 25–30% и лучше держит тепло. '
                    .'Используйте его для наружных стен выше цоколя.</p><h2>Облицовочный кирпич</h2><p>Нужен для красивого фасада: '
                    .'ровная геометрия, одинаковый цвет в партии.</p><h3>Сколько кирпича нужно</h3>'
                    .'<table><thead><tr><th>Толщина стены</th><th>Штук на 1 м²</th></tr></thead><tbody>'
                    .'<tr><td>в полкирпича (120 мм)</td><td>51</td></tr><tr><td>в кирпич (250 мм)</td><td>102</td></tr>'
                    .'<tr><td>в 1,5 кирпича (380 мм)</td><td>153</td></tr></tbody></table>',
            ],
            [
                'type' => NewsType::Promo, 'days_ago' => 12, 'icon' => 'roof', 'palette' => ['#15803D', '#14532D'], 'products' => 'Профнастил%',
                'title' => 'Сезон кровли: профнастил и металлочерепица со скидкой 15%',
                'excerpt' => 'Готовим крышу к зиме — скидка на кровлю и бесплатный расчёт материалов.',
                'gallery' => ['Профнастил RAL 6005', 'Металлочерепица Монтеррей'],
                'body' => '<p>Скидка <strong>15%</strong> на профнастил С20 и металлочерепицу Монтеррей при заказе от 50 м².</p>'
                    .'<p>Пришлите размеры крыши — мы бесплатно посчитаем листы, коньки, саморезы и гидроизоляцию.</p>',
            ],
            [
                'type' => NewsType::Article, 'days_ago' => 18, 'icon' => 'bucket', 'palette' => ['#334155', '#0F172A'], 'products' => 'Штукатурка%',
                'title' => 'Гипсовая или цементная штукатурка: что выбрать для ремонта',
                'excerpt' => 'Где лучше гипс, а где без цемента не обойтись — простое сравнение.',
                'gallery' => [],
                'body' => '<h2>Гипсовая штукатурка</h2><p>Для сухих помещений: комнаты, коридоры. Наносится толстым слоем, '
                    .'быстро сохнет, даёт гладкую поверхность под покраску.</p><h2>Цементная штукатурка</h2>'
                    .'<p>Для ванных, кухонь, фасадов и цоколя — не боится влаги и перепадов температуры.</p>'
                    .'<p><em>Совет:</em> перед штукатуркой обязательно загрунтуйте стену.</p>',
            ],
            [
                'type' => NewsType::News, 'days_ago' => 25, 'icon' => 'drill', 'palette' => ['#1E40AF', '#0F172A'], 'products' => 'Перфоратор%',
                'title' => 'В продаже появился электроинструмент Bosch',
                'excerpt' => 'Перфораторы, болгарки и шуруповёрты с официальной гарантией.',
                'gallery' => ['Витрина электроинструмента'],
                'body' => '<p>Теперь у нас можно купить электроинструмент <strong>Bosch</strong> с официальной гарантией 2 года. '
                    .'Перфораторы, болгарки, шуруповёрты и лазерные уровни — в наличии на складе.</p>',
            ],
        ];
    }
}
