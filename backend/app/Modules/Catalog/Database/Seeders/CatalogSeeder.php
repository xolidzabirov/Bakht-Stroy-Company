<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Database\Seeders;

use App\Modules\Catalog\Enums\ProductUnit;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Support\UniqueSlug;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo catalog of real construction materials (prices in sums).
 * Safe to run again: categories and products are matched by name.
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $sort = 0;

            foreach ($this->catalog() as $rootName => $children) {
                $root = $this->category($rootName, null, $sort++);

                $childSort = 0;
                foreach ($children as $childName => $products) {
                    $child = $this->category($childName, $root->id, $childSort++);

                    foreach ($products as $product) {
                        $this->product($child, ...$product);
                    }
                }
            }
        });

        $this->command?->info('CatalogSeeder: '.Category::query()->count().' categories, '.Product::query()->count().' products.');
    }

    private function category(string $name, ?int $parentId, int $sort): Category
    {
        return Category::query()->firstOrCreate(
            ['name' => $name, 'parent_id' => $parentId],
            ['slug' => UniqueSlug::for(Category::class, $name), 'sort_order' => $sort, 'is_active' => true],
        );
    }

    /**
     * @param  array<string, string>  $specs
     */
    private function product(
        Category $category,
        string $name,
        int $price,
        ProductUnit $unit,
        int $stock,
        array $specs,
        ?int $oldPrice = null,
        bool $featured = false,
        int $minOrder = 1,
    ): void {
        $product = Product::query()->firstOrNew(['name' => $name]);

        $product->fill([
            'category_id' => $category->id,
            'slug' => $product->exists ? $product->slug : UniqueSlug::for(Product::class, $name),
            'description' => $this->description($name, $specs),
            'price' => $price,
            'old_price' => $oldPrice,
            'unit' => $unit,
            'stock' => $stock,
            'min_order_qty' => $minOrder,
            'specs' => collect($specs)->map(fn (string $value, string $key) => ['name' => $key, 'value' => $value])->values()->all(),
            'is_active' => true,
            'is_featured' => $featured,
        ])->save();

        if ($product->sku === null) {
            $product->forceFill(['sku' => sprintf('BS-%06d', $product->id)])->save();
        }
    }

    /**
     * @param  array<string, string>  $specs
     */
    private function description(string $name, array $specs): string
    {
        $details = collect($specs)->map(fn (string $value, string $key) => mb_strtolower($key).': '.$value)->implode(', ');

        return "{$name}. {$details}. Доставка по городу и области, самовывоз со склада.";
    }

    /**
     * root => [subcategory => [[name, price, unit, stock, specs, oldPrice?, featured?, minOrder?], ...]]
     *
     * @return array<string, array<string, list<array<int, mixed>>>>
     */
    private function catalog(): array
    {
        return [
            'Цемент и сухие смеси' => [
                'Цемент' => [
                    ['Цемент М400 Д20, 50 кг', 58000, ProductUnit::Bag, 800, ['Марка' => 'М400', 'Вес' => '50 кг', 'Производитель' => 'Ахангаранцемент'], null, true],
                    ['Цемент М500 Д0, 50 кг', 69000, ProductUnit::Bag, 650, ['Марка' => 'М500', 'Вес' => '50 кг', 'Производитель' => 'Кызылкумцемент'], 75000, true],
                    ['Цемент белый М600, 25 кг', 96000, ProductUnit::Bag, 120, ['Марка' => 'М600', 'Вес' => '25 кг', 'Цвет' => 'белый']],
                ],
                'Штукатурки и шпаклёвки' => [
                    ['Штукатурка гипсовая Ротбанд, 30 кг', 98000, ProductUnit::Bag, 300, ['Основа' => 'гипс', 'Вес' => '30 кг', 'Производитель' => 'Knauf'], null, true],
                    ['Шпаклёвка финишная полимерная, 20 кг', 115000, ProductUnit::Bag, 180, ['Основа' => 'полимер', 'Вес' => '20 кг']],
                    ['Штукатурка цементная фасадная, 25 кг', 62000, ProductUnit::Bag, 260, ['Основа' => 'цемент', 'Вес' => '25 кг', 'Применение' => 'наружные работы']],
                ],
                'Плиточный клей' => [
                    ['Клей для плитки усиленный, 25 кг', 72000, ProductUnit::Bag, 400, ['Класс' => 'C1', 'Вес' => '25 кг']],
                    ['Клей для керамогранита, 25 кг', 89000, ProductUnit::Bag, 220, ['Класс' => 'C2TE', 'Вес' => '25 кг'], 95000],
                ],
            ],
            'Кирпич и блоки' => [
                'Кирпич' => [
                    ['Кирпич красный полнотелый М150', 1300, ProductUnit::Piece, 50000, ['Размер' => '250×120×65 мм', 'Марка' => 'М150'], null, true, 500],
                    ['Кирпич облицовочный жёлтый', 2400, ProductUnit::Piece, 15000, ['Размер' => '250×120×65 мм', 'Тип' => 'пустотелый'], null, false, 200],
                ],
                'Газоблоки и пеноблоки' => [
                    ['Газоблок D500 600×300×200', 21000, ProductUnit::Piece, 6000, ['Плотность' => 'D500', 'Размер' => '600×300×200 мм'], null, true, 20],
                    ['Пеноблок D600 600×300×200', 18500, ProductUnit::Piece, 4000, ['Плотность' => 'D600', 'Размер' => '600×300×200 мм'], null, false, 20],
                    ['Блок перегородочный 600×300×100', 11500, ProductUnit::Piece, 3500, ['Плотность' => 'D500', 'Размер' => '600×300×100 мм'], null, false, 20],
                ],
            ],
            'Металлопрокат' => [
                'Арматура' => [
                    ['Арматура А500С 12 мм', 13500, ProductUnit::Meter, 20000, ['Диаметр' => '12 мм', 'Класс' => 'А500С', 'Длина прутка' => '11,7 м'], null, true, 12],
                    ['Арматура А500С 10 мм', 9800, ProductUnit::Meter, 18000, ['Диаметр' => '10 мм', 'Класс' => 'А500С', 'Длина прутка' => '11,7 м'], null, false, 12],
                    ['Проволока вязальная 1,2 мм', 32000, ProductUnit::Kilogram, 900, ['Диаметр' => '1,2 мм', 'Покрытие' => 'отожжённая']],
                ],
                'Профильная труба' => [
                    ['Труба профильная 40×20×2 мм', 26000, ProductUnit::Meter, 5000, ['Сечение' => '40×20 мм', 'Стенка' => '2 мм'], null, false, 6],
                    ['Труба профильная 60×40×2 мм', 39000, ProductUnit::Meter, 3500, ['Сечение' => '60×40 мм', 'Стенка' => '2 мм'], null, false, 6],
                ],
            ],
            'Кровля' => [
                'Профнастил' => [
                    ['Профнастил С8 оцинкованный 0,45 мм', 68000, ProductUnit::SquareMeter, 2500, ['Толщина' => '0,45 мм', 'Покрытие' => 'цинк']],
                    ['Профнастил НС35 с полимерным покрытием', 89000, ProductUnit::SquareMeter, 1800, ['Толщина' => '0,5 мм', 'Цвет' => 'RAL 3005 вишня'], 99000, true],
                ],
                'Металлочерепица' => [
                    ['Металлочерепица Монтеррей 0,45 мм', 95000, ProductUnit::SquareMeter, 1500, ['Толщина' => '0,45 мм', 'Цвет' => 'RAL 8017 коричневый']],
                ],
                'Шифер' => [
                    ['Шифер 8-волновой 1750×1130 мм', 87000, ProductUnit::Sheet, 900, ['Размер' => '1750×1130 мм', 'Толщина' => '5,2 мм']],
                ],
            ],
            'Утеплители' => [
                'Минеральная вата' => [
                    ['Минвата Rockwool Лайт Баттс 50 мм', 265000, ProductUnit::Pack, 300, ['Толщина' => '50 мм', 'Площадь в упаковке' => '5,76 м²'], null, true],
                    ['Стекловата Knauf рулон 50 мм', 235000, ProductUnit::Roll, 250, ['Толщина' => '50 мм', 'Площадь' => '18 м²']],
                ],
                'Пенопласт и ЭППС' => [
                    ['Пенопласт ПСБ-С 25, 50 мм', 19000, ProductUnit::Sheet, 2000, ['Толщина' => '50 мм', 'Размер' => '1000×1000 мм', 'Плотность' => '15 кг/м³']],
                    ['Экструдированный пенополистирол 50 мм', 52000, ProductUnit::Sheet, 900, ['Толщина' => '50 мм', 'Размер' => '1180×580 мм']],
                ],
            ],
            'Гипсокартон и профиль' => [
                'Гипсокартон' => [
                    ['Гипсокартон стеновой 12,5 мм', 62000, ProductUnit::Sheet, 1200, ['Размер' => '2500×1200 мм', 'Толщина' => '12,5 мм', 'Производитель' => 'Knauf'], null, true],
                    ['Гипсокартон влагостойкий 12,5 мм', 79000, ProductUnit::Sheet, 700, ['Размер' => '2500×1200 мм', 'Толщина' => '12,5 мм', 'Тип' => 'ГКЛВ']],
                ],
                'Профиль для ГКЛ' => [
                    ['Профиль ПП 60×27, 3 м', 24000, ProductUnit::Piece, 3000, ['Длина' => '3 м', 'Толщина металла' => '0,45 мм']],
                    ['Профиль ПН 28×27, 3 м', 18000, ProductUnit::Piece, 2800, ['Длина' => '3 м', 'Толщина металла' => '0,45 мм']],
                ],
            ],
            'Сыпучие материалы' => [
                'Песок и щебень' => [
                    ['Песок строительный мытый', 185000, ProductUnit::Ton, 400, ['Фракция' => '0–2,5 мм', 'Тип' => 'речной']],
                    ['Щебень гранитный 5–20 мм', 240000, ProductUnit::Ton, 350, ['Фракция' => '5–20 мм', 'Порода' => 'гранит'], null, true],
                    ['Керамзит фракция 10–20 мм', 420000, ProductUnit::CubicMeter, 120, ['Фракция' => '10–20 мм']],
                ],
            ],
            'Инструменты' => [
                'Ручной инструмент' => [
                    ['Мастерок штукатурный 180 мм', 45000, ProductUnit::Piece, 150, ['Длина полотна' => '180 мм', 'Материал' => 'нержавеющая сталь']],
                    ['Уровень строительный 100 см', 135000, ProductUnit::Piece, 80, ['Длина' => '100 см', 'Количество глазков' => '3']],
                    ['Рулетка 5 м', 38000, ProductUnit::Piece, 200, ['Длина' => '5 м']],
                ],
                'Электроинструмент' => [
                    ['Перфоратор SDS-Plus 800 Вт', 1250000, ProductUnit::Piece, 25, ['Мощность' => '800 Вт', 'Энергия удара' => '2,8 Дж'], 1390000, true],
                    ['Болгарка 125 мм 900 Вт', 690000, ProductUnit::Piece, 40, ['Мощность' => '900 Вт', 'Диаметр диска' => '125 мм']],
                    ['Шуруповёрт аккумуляторный 18 В', 980000, ProductUnit::Piece, 5, ['Напряжение' => '18 В', 'Аккумуляторы' => '2 шт']],
                ],
            ],
        ];
    }
}
