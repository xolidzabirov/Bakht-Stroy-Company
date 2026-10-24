<?php

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;

beforeEach(function () {
    $this->root = Category::factory()->create(['name' => 'Цемент и смеси', 'slug' => 'tsement-i-smesi', 'sort_order' => 0]);
    $this->cement = Category::factory()->childOf($this->root)->create(['name' => 'Цемент', 'slug' => 'tsement']);
    $this->glue = Category::factory()->childOf($this->root)->create(['name' => 'Клей', 'slug' => 'klei']);
    $this->hidden = Category::factory()->inactive()->create(['name' => 'Скрытая', 'slug' => 'skrytaya', 'sort_order' => 1]);

    $this->m500 = Product::factory()->for($this->cement)->featured()->discounted(75000)->create([
        'name' => 'Цемент М500 Д0, 50 кг', 'slug' => 'tsement-m500', 'sku' => 'BS-000001', 'price' => 69000, 'stock' => 100,
    ]);
    $this->m400 = Product::factory()->for($this->cement)->create([
        'name' => 'Цемент М400 Д20, 50 кг', 'slug' => 'tsement-m400', 'sku' => 'BS-000002', 'price' => 58000, 'stock' => 0,
    ]);
    $this->tileGlue = Product::factory()->for($this->glue)->create([
        'name' => 'Клей для плитки', 'slug' => 'klei-dlya-plitki', 'sku' => 'BS-000003', 'price' => 72000, 'stock' => 50,
    ]);
    Product::factory()->for($this->cement)->inactive()->create(['name' => 'Скрытый товар', 'price' => 1000]);
    Product::factory()->for($this->hidden)->create(['name' => 'Товар скрытой категории', 'price' => 1000]);
});

function productNames($response): array
{
    return collect($response->json('data'))->pluck('name')->all();
}

it('shows the active category tree with product counts to guests', function () {
    $response = $this->getJson('/api/v1/categories')->assertOk();

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.slug'))->toBe('tsement-i-smesi')
        ->and($response->json('data.0.products_count'))->toBe(3)
        ->and(collect($response->json('data.0.children'))->pluck('products_count', 'slug')->all())
        ->toBe(['klei' => 1, 'tsement' => 2]);
});

it('shows a category with its parent and children', function () {
    $this->getJson('/api/v1/categories/tsement')
        ->assertOk()
        ->assertJsonPath('data.name', 'Цемент')
        ->assertJsonPath('data.parent.slug', 'tsement-i-smesi');

    $this->getJson('/api/v1/categories/tsement-i-smesi')
        ->assertOk()
        ->assertJsonCount(2, 'data.children');
});

it('hides inactive and unknown categories', function (string $slug) {
    $this->getJson("/api/v1/categories/{$slug}")->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
})->with(['skrytaya', 'net-takoi']);

it('lists only visible products with pagination', function () {
    $response = $this->getJson('/api/v1/products?per_page=2')->assertOk();

    expect($response->json('meta.total'))->toBe(3)
        ->and($response->json('meta.per_page'))->toBe(2)
        ->and($response->json('data'))->toHaveCount(2)
        ->and($response->json('data.0.name'))->toBe('Цемент М500 Д0, 50 кг'); // featured first

    $response->assertJsonStructure(['data' => [['id', 'name', 'slug', 'sku', 'price', 'old_price', 'discount_percent',
        'unit' => ['value', 'label'], 'stock', 'in_stock', 'is_featured', 'image', 'category' => ['id', 'name', 'slug']]],
        'links', 'meta' => ['current_page', 'last_page', 'total']]);
});

it('includes subcategory products when filtering by a root category', function () {
    expect(productNames($this->getJson('/api/v1/products?category=tsement-i-smesi')))->toHaveCount(3)
        ->and(productNames($this->getJson('/api/v1/products?category=klei')))->toBe(['Клей для плитки'])
        ->and(productNames($this->getJson('/api/v1/products?category=net-takoi')))->toBe([]);
});

it('filters by price, stock and featured', function () {
    expect(productNames($this->getJson('/api/v1/products?price_min=60000&price_max=70000')))->toBe(['Цемент М500 Д0, 50 кг'])
        ->and(productNames($this->getJson('/api/v1/products?price_max=60000')))->toBe(['Цемент М400 Д20, 50 кг'])
        ->and(productNames($this->getJson('/api/v1/products?in_stock=true&sort=price')))->toBe(['Цемент М500 Д0, 50 кг', 'Клей для плитки'])
        ->and(productNames($this->getJson('/api/v1/products?featured=1')))->toBe(['Цемент М500 Д0, 50 кг']);
});

it('sorts products', function (string $sort, array $expected) {
    expect(productNames($this->getJson("/api/v1/products?sort={$sort}")))->toBe($expected);
})->with([
    'price asc' => ['price', ['Цемент М400 Д20, 50 кг', 'Цемент М500 Д0, 50 кг', 'Клей для плитки']],
    'price desc' => ['-price', ['Клей для плитки', 'Цемент М500 Д0, 50 кг', 'Цемент М400 Д20, 50 кг']],
    'name' => ['name', ['Клей для плитки', 'Цемент М400 Д20, 50 кг', 'Цемент М500 Д0, 50 кг']],
]);

it('searches in russian by word forms, partial name and sku', function (string $search, array $expected) {
    $names = productNames($this->getJson('/api/v1/products?sort=name&search='.urlencode($search)));

    expect($names)->toBe($expected);
})->with([
    'word form' => ['цементы', ['Цемент М400 Д20, 50 кг', 'Цемент М500 Д0, 50 кг']],
    'partial' => ['м50', ['Цемент М500 Д0, 50 кг']],
    'upper case' => ['КЛЕЙ', ['Клей для плитки']],
    'sku' => ['bs-000003', ['Клей для плитки']],
    'nothing' => ['бетон', []],
]);

it('validates list filters', function (string $query, string $field) {
    $this->getJson("/api/v1/products?{$query}")->assertUnprocessable()->assertJsonValidationErrors($field);
})->with([
    ['sort=cheap', 'sort'],
    ['per_page=500', 'per_page'],
    ['price_min=100&price_max=50', 'price_max'],
    ['in_stock=maybe', 'in_stock'],
]);

it('shows a product page and counts views', function () {
    $this->getJson('/api/v1/products/tsement-m500')
        ->assertOk()
        ->assertJsonPath('data.name', 'Цемент М500 Д0, 50 кг')
        ->assertJsonPath('data.discount_percent', 8)
        ->assertJsonPath('data.category.slug', 'tsement')
        ->assertJsonPath('data.category.parent.slug', 'tsement-i-smesi')
        ->assertJsonStructure(['data' => ['description', 'specs', 'images']]);

    $this->getJson('/api/v1/products/tsement-m500');

    expect($this->m500->refresh()->views_count)->toBe(2);
});

it('hides inactive products and products of hidden categories', function () {
    $inactive = Product::query()->where('name', 'Скрытый товар')->first();
    $inHiddenCategory = Product::query()->where('name', 'Товар скрытой категории')->first();

    $this->getJson("/api/v1/products/{$inactive->slug}")->assertNotFound();
    $this->getJson("/api/v1/products/{$inHiddenCategory->slug}")->assertNotFound();
});

it('returns related products from the same category', function () {
    expect(productNames($this->getJson('/api/v1/products/tsement-m500/related')))->toBe(['Цемент М400 Д20, 50 кг']);
});
