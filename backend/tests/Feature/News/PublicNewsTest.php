<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\News\Enums\NewsType;
use App\Modules\News\Models\News;

it('lists only published news, pinned first, then newest', function () {
    News::factory()->create(['title' => 'Старая', 'published_at' => now()->subDays(10)]);
    News::factory()->create(['title' => 'Новая', 'published_at' => now()->subDay()]);
    News::factory()->pinned()->create(['title' => 'Закреплённая', 'published_at' => now()->subDays(30)]);
    News::factory()->draft()->create(['title' => 'Черновик']);
    News::factory()->scheduled()->create(['title' => 'Завтра']);

    $response = $this->getJson('/api/v1/news')->assertOk();

    expect(collect($response->json('data'))->pluck('title')->all())->toBe(['Закреплённая', 'Новая', 'Старая'])
        ->and($response->json('meta.total'))->toBe(3);

    $response->assertJsonStructure(['data' => [['id', 'type' => ['value', 'label'], 'title', 'slug', 'excerpt', 'cover', 'is_pinned', 'reading_time', 'views_count', 'published_at']]]);
});

it('filters by type and searches', function () {
    News::factory()->type(NewsType::Promo)->create(['title' => 'Скидка на цемент']);
    News::factory()->type(NewsType::Article)->create(['title' => 'Как выбрать кирпич', 'body' => '<p>Советы про ЦЕМЕНТНЫЙ раствор</p>']);
    News::factory()->create(['title' => 'Открыли новый склад']);

    expect(collect($this->getJson('/api/v1/news?type=promo')->json('data'))->pluck('title')->all())->toBe(['Скидка на цемент'])
        ->and($this->getJson('/api/v1/news?search='.urlencode('цемент'))->json('meta.total'))->toBe(2);

    $this->getJson('/api/v1/news?type=gossip')->assertUnprocessable();
});

it('returns news types with counts', function () {
    News::factory()->type(NewsType::Promo)->count(2)->create();
    News::factory()->type(NewsType::Promo)->draft()->create();

    $this->getJson('/api/v1/news/types')
        ->assertOk()
        ->assertJsonPath('data.1', ['value' => 'promo', 'label' => 'Акции', 'count' => 2]);
});

it('shows a news page with products, neighbours and related news', function () {
    $older = News::factory()->create(['title' => 'Раньше', 'published_at' => now()->subDays(5)]);
    $news = News::factory()->create([
        'title' => 'Акция на кирпич', 'slug' => 'aktsiya', 'published_at' => now()->subDays(3),
        'body' => '<h2>Условия</h2><p>'.str_repeat('слово ', 400).'</p>',
        'video_url' => 'https://youtu.be/dQw4w9WgXcQ',
    ]);
    $newer = News::factory()->create(['title' => 'Позже', 'published_at' => now()->subDay()]);
    $brick = Product::factory()->create(['name' => 'Кирпич']);
    $hidden = Product::factory()->inactive()->create();
    $news->products()->attach([$brick->id => ['sort_order' => 0], $hidden->id => ['sort_order' => 1]]);

    $this->getJson('/api/v1/news/aktsiya')
        ->assertOk()
        ->assertJsonPath('data.title', 'Акция на кирпич')
        ->assertJsonPath('data.reading_time', 3)
        ->assertJsonPath('data.video_embed_url', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
        ->assertJsonPath('data.products.0.name', 'Кирпич')
        ->assertJsonCount(1, 'data.products')
        ->assertJsonPath('data.previous.slug', $older->slug)
        ->assertJsonPath('data.next.slug', $newer->slug)
        ->assertJsonCount(2, 'data.related')
        ->assertJsonPath('data.meta.title', 'Акция на кирпич');

    // Opening the post does not count — the site sends a separate view request.
    expect($news->refresh()->views_count)->toBe(0);

    $this->postJson("/api/v1/news/{$news->slug}/view")->assertNoContent();
    $this->postJson("/api/v1/news/{$news->slug}/view")->assertNoContent();
    $this->postJson('/api/v1/news/no-such-post/view')->assertNotFound();

    expect($news->refresh()->views_count)->toBe(2);
});

it('hides drafts, scheduled and deleted news', function () {
    $draft = News::factory()->draft()->create();
    $scheduled = News::factory()->scheduled()->create();
    $deleted = News::factory()->create();
    $deleted->delete();

    foreach ([$draft, $scheduled, $deleted] as $news) {
        $this->getJson("/api/v1/news/{$news->slug}")->assertNotFound();
    }
});

it('shows scheduled news once its time comes', function () {
    $news = News::factory()->create(['published_at' => now()->addHour()]);

    $this->getJson("/api/v1/news/{$news->slug}")->assertNotFound();
    $this->travel(2)->hours();
    $this->getJson("/api/v1/news/{$news->slug}")->assertOk();
});
