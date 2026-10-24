<?php

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->token = User::factory()->admin()->create()->createToken('Pest')->plainTextToken;
    $this->category = Category::factory()->create(['name' => 'Цемент']);
});

function productPayload(array $overrides = []): array
{
    return array_merge([
        'category_id' => test()->category->id,
        'name' => 'Цемент М500 Д0, 50 кг',
        'description' => 'Портландцемент',
        'price' => 69000,
        'old_price' => 75000,
        'unit' => 'bag',
        'stock' => 650,
        'specs' => [['name' => 'Марка', 'value' => 'М500'], ['name' => 'Вес', 'value' => '50 кг']],
        'is_featured' => true,
    ], $overrides);
}

it('forbids clients and allows admins', function () {
    $client = User::factory()->client()->create()->createToken('Pest')->plainTextToken;
    $admin = User::factory()->admin()->create()->createToken('Pest')->plainTextToken;

    $this->withToken($client)->getJson('/api/v1/admin/products')->assertForbidden();
    $this->app['auth']->forgetGuards();
    $this->withToken($admin)->getJson('/api/v1/admin/products')->assertOk();
});

it('creates a product with generated slug and sku', function () {
    $response = $this->withToken($this->token)->postJson('/api/v1/admin/products', productPayload())->assertCreated();

    $product = Product::query()->sole();

    $response->assertJsonPath('data.slug', 'tsement-m500-d0-50-kg')
        ->assertJsonPath('data.sku', sprintf('BS-%06d', $product->id))
        ->assertJsonPath('data.price', 69000)
        ->assertJsonPath('data.discount_percent', 8)
        ->assertJsonPath('data.unit.label', 'мешок')
        ->assertJsonPath('data.specs.0.value', 'М500')
        ->assertJsonPath('data.is_active', true)
        ->assertJsonPath('data.is_featured', true)
        ->assertJsonPath('data.category.id', $this->category->id);
});

it('validates product fields', function (array $overrides, string $field) {
    $this->withToken($this->token)
        ->postJson('/api/v1/admin/products', productPayload($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    'missing name' => [['name' => ''], 'name'],
    'unknown category' => [['category_id' => 999999], 'category_id'],
    'negative price' => [['price' => -1], 'price'],
    'old price not higher' => [['old_price' => 60000], 'old_price'],
    'unknown unit' => [['unit' => 'barrel'], 'unit'],
    'spec without value' => [['specs' => [['name' => 'Марка']]], 'specs.0.value'],
]);

it('updates only the sent fields and keeps the slug', function () {
    $product = Product::factory()->for($this->category)->create(['name' => 'Старое', 'slug' => 'staroe', 'price' => 50000, 'stock' => 10]);

    $this->withToken($this->token)
        ->patchJson("/api/v1/admin/products/{$product->id}", ['name' => 'Новое имя', 'is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.name', 'Новое имя')
        ->assertJsonPath('data.slug', 'staroe')
        ->assertJsonPath('data.price', 50000)
        ->assertJsonPath('data.stock', 10)
        ->assertJsonPath('data.is_active', false);
});

it('compares old_price with the current price on partial update', function () {
    $product = Product::factory()->for($this->category)->create(['price' => 50000]);

    $this->withToken($this->token)->patchJson("/api/v1/admin/products/{$product->id}", ['old_price' => 40000])
        ->assertUnprocessable()->assertJsonValidationErrors('old_price');

    $this->withToken($this->token)->patchJson("/api/v1/admin/products/{$product->id}", ['old_price' => 60000])
        ->assertOk()->assertJsonPath('data.discount_percent', 17);
});

it('lists hidden products for admins and filters by is_active', function () {
    Product::factory()->for($this->category)->create(['name' => 'Видимый']);
    Product::factory()->for($this->category)->inactive()->create(['name' => 'Скрытый']);

    $all = $this->withToken($this->token)->getJson('/api/v1/admin/products')->assertOk();
    $hidden = $this->withToken($this->token)->getJson('/api/v1/admin/products?is_active=false')->assertOk();

    expect($all->json('meta.total'))->toBe(2)
        ->and(collect($hidden->json('data'))->pluck('name')->all())->toBe(['Скрытый']);
});

it('updates stock and lists low-stock products', function () {
    config(['shop.low_stock_threshold' => 10]);
    $product = Product::factory()->for($this->category)->create(['stock' => 100]);
    Product::factory()->for($this->category)->create(['name' => 'Заканчивается', 'stock' => 3]);

    $this->withToken($this->token)->patchJson("/api/v1/admin/products/{$product->id}/stock", ['stock' => 7])
        ->assertOk()
        ->assertJsonPath('data.stock', 7)
        ->assertJsonPath('data.is_low_stock', true);

    $low = $this->withToken($this->token)->getJson('/api/v1/admin/products/low-stock')->assertOk();

    expect(collect($low->json('data'))->pluck('stock')->all())->toBe([3, 7]);
});

it('soft deletes a product and hides it from the shop', function () {
    $product = Product::factory()->for($this->category)->create(['slug' => 'udalyaemyi']);

    $this->withToken($this->token)->deleteJson("/api/v1/admin/products/{$product->id}")->assertNoContent();

    expect(Product::withTrashed()->find($product->id)->trashed())->toBeTrue();

    $this->getJson('/api/v1/products/udalyaemyi')->assertNotFound();
    $this->withToken($this->token)->getJson("/api/v1/admin/products/{$product->id}")->assertNotFound();
});

it('uploads product images with webp previews and deletes them', function () {
    Storage::fake('public');
    $product = Product::factory()->for($this->category)->create();

    $response = $this->withToken($this->token)
        ->post("/api/v1/admin/products/{$product->id}/images", ['images' => [
            UploadedFile::fake()->image('front.jpg', 1200, 900),
            UploadedFile::fake()->image('back.png', 800, 800),
        ]])
        ->assertOk()
        ->assertJsonCount(2, 'data.images');

    expect($response->json('data.image.card'))->toEndWith('.webp')
        ->and($response->json('data.images.0.thumb'))->toContain('thumb');

    $mediaId = $response->json('data.images.0.id');

    $this->withToken($this->token)->deleteJson("/api/v1/admin/products/{$product->id}/images/{$mediaId}")->assertNoContent();
    $this->withToken($this->token)->deleteJson("/api/v1/admin/products/{$product->id}/images/{$mediaId}")->assertNotFound();

    expect($product->refresh()->getMedia(Product::IMAGES_COLLECTION))->toHaveCount(1);
});

it('limits a product to 10 images', function () {
    Storage::fake('public');
    $product = Product::factory()->for($this->category)->create();
    $images = fn (int $count) => array_map(fn ($i) => UploadedFile::fake()->image("p{$i}.jpg", 100, 100), range(1, $count));

    $this->withToken($this->token)->post("/api/v1/admin/products/{$product->id}/images", ['images' => $images(8)])->assertOk();

    $this->withToken($this->token)->post("/api/v1/admin/products/{$product->id}/images", ['images' => $images(3)])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'TOO_MANY_IMAGES');
});

it('rejects non-image uploads', function () {
    $product = Product::factory()->for($this->category)->create();

    $this->withToken($this->token)
        ->post("/api/v1/admin/products/{$product->id}/images", ['images' => [UploadedFile::fake()->create('virus.exe', 10)]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('images.0');
});

it('does not reuse the slug of a deleted product', function () {
    Product::factory()->for($this->category)->create(['slug' => 'tsement-m500-d0-50-kg'])->delete();

    $this->withToken($this->token)->postJson('/api/v1/admin/products', productPayload())
        ->assertCreated()
        ->assertJsonPath('data.slug', 'tsement-m500-d0-50-kg-2');
});
