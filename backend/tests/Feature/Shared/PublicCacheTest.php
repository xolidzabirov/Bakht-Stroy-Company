<?php

use App\Modules\Cart\Models\CartItem;
use App\Modules\Catalog\Models\Product;
use App\Modules\Content\Models\Banner;
use App\Modules\News\Models\News;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

function queriesOf(Closure $request): int
{
    DB::flushQueryLog();
    DB::enableQueryLog();
    $request();
    $count = count(DB::getQueryLog());
    DB::disableQueryLog();

    return $count;
}

it('answers the second time without asking for the products again', function () {
    Product::factory()->count(3)->create();

    $first = 0;
    $firstCount = queriesOf(function () use (&$first) {
        $first = $this->getJson('/api/v1/products?per_page=8')->assertOk()->assertHeaderMissing('X-Public-Cache')->json('data');
    });
    $secondCount = queriesOf(function () use ($first) {
        expect($this->getJson('/api/v1/products?per_page=8')->assertOk()->assertHeader('X-Public-Cache', 'hit')->json('data'))->toBe($first);
    });

    expect($firstCount)->toBeGreaterThan(0)->and($secondCount)->toBe(0);
});

it('keeps the answer readable', function () {
    Product::factory()->create(['name' => 'Цемент М500']);

    $this->getJson('/api/v1/products')->assertOk();

    $kept = $this->getJson('/api/v1/products')->assertHeader('X-Public-Cache', 'hit');

    expect($kept->getContent())->toContain('Цемент М500')
        ->and($kept->headers->get('Content-Type'))->toContain('application/json');
});

it('shows a changed product at once', function () {
    $product = Product::factory()->create(['price' => 5000]);

    $this->getJson('/api/v1/products')->assertJsonPath('data.0.price', 5000);
    $this->getJson("/api/v1/products/{$product->slug}")->assertJsonPath('data.price', 5000);

    $product->update(['price' => 7000]);

    $this->getJson('/api/v1/products')->assertHeaderMissing('X-Public-Cache')->assertJsonPath('data.0.price', 7000);
    $this->getJson("/api/v1/products/{$product->slug}")->assertJsonPath('data.price', 7000);
});

it('forgets a deleted product at once', function () {
    $product = Product::factory()->create();

    $this->getJson('/api/v1/products')->assertJsonCount(1, 'data');

    $product->delete();

    $this->getJson('/api/v1/products')->assertJsonCount(0, 'data');
});

it('shows the new stock right after an order and after its cancellation', function () {
    $user = User::factory()->client()->create();
    $product = Product::factory()->create(['stock' => 10]);
    CartItem::factory()->create(['user_id' => $user->id, 'product_id' => $product->id, 'quantity' => 4]);

    $this->getJson("/api/v1/products/{$product->slug}")->assertJsonPath('data.stock', 10);

    $number = $this->withToken($user->createToken('Pest')->plainTextToken)
        ->postJson('/api/v1/orders', ['delivery_type' => 'pickup', 'payment_method' => 'cash'])
        ->assertCreated()
        ->json('data.number');

    $this->flushHeaders();
    $this->getJson("/api/v1/products/{$product->slug}")->assertJsonPath('data.stock', 6);

    app(App\Modules\Order\Actions\ChangeOrderStatus::class)->handle(Order::query()->where('number', $number)->firstOrFail(), OrderStatus::Cancelled);

    $this->getJson("/api/v1/products/{$product->slug}")->assertJsonPath('data.stock', 10);
});

it('shows changed banners and news at once', function () {
    $banner = Banner::factory()->create(['title' => 'Старый баннер']);
    $news = News::factory()->create(['title' => 'Старая новость']);

    $this->getJson('/api/v1/banners')->assertOk()->assertJsonPath('data.0.title', 'Старый баннер');
    $this->getJson('/api/v1/news')->assertOk()->assertJsonPath('data.0.title', 'Старая новость');

    $banner->update(['title' => 'Новый баннер']);
    $news->update(['title' => 'Новая новость']);

    $this->getJson('/api/v1/banners')->assertJsonPath('data.0.title', 'Новый баннер');
    $this->getJson('/api/v1/news')->assertJsonPath('data.0.title', 'Новая новость');
});

it('does not keep what cannot be counted or depends on the person', function (string $uri) {
    Product::factory()->create();

    $this->getJson($uri)->assertOk();
    $this->getJson($uri)->assertOk()->assertHeaderMissing('X-Public-Cache');
})->with(['/api/v1/products?search=цемент', '/api/v1/products?price_min=100', '/api/v1/products?page=6', '/api/v1/products?anything=1']);

it('answers a signed-in visitor with their own favorites, never from the shared answer', function () {
    $user = User::factory()->client()->create();
    $product = Product::factory()->create();
    $token = $user->createToken('Pest')->plainTextToken;

    $this->getJson('/api/v1/products')->assertJsonPath('data.0.is_favorite', false);

    $this->withToken($token)->postJson("/api/v1/favorites/{$product->id}")->assertSuccessful();

    $this->withToken($token)->getJson('/api/v1/products')
        ->assertHeaderMissing('X-Public-Cache')
        ->assertJsonPath('data.0.is_favorite', true);
});

it('does not keep errors', function () {
    $this->getJson('/api/v1/products/no-such-product')->assertNotFound();
    $this->getJson('/api/v1/products/no-such-product')->assertNotFound()->assertHeaderMissing('X-Public-Cache');
});
