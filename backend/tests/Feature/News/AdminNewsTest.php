<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\News\Models\News;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create(['name' => 'Админ']);
    $this->token = $this->admin->createToken('Pest')->plainTextToken;
});

it('is closed for clients', function () {
    $this->withToken(User::factory()->client()->create()->createToken('Pest')->plainTextToken)
        ->postJson('/api/v1/admin/news', ['type' => 'news', 'title' => 'Тест', 'body' => '<p>x</p>'])
        ->assertForbidden();
});

it('creates a draft by default with a latin slug and the author', function () {
    $this->withToken($this->token)->postJson('/api/v1/admin/news', [
        'type' => 'promo', 'title' => 'Скидка на цемент', 'body' => '<p>Текст акции</p>',
    ])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'skidka-na-tsement')
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.published_at', null)
        ->assertJsonPath('data.author.name', 'Админ');

    $this->getJson('/api/v1/news/skidka-na-tsement')->assertNotFound();
});

it('publishes now or on schedule', function () {
    $now = $this->withToken($this->token)->postJson('/api/v1/admin/news', [
        'type' => 'news', 'title' => 'Сразу', 'body' => '<p>Текст</p>', 'is_published' => true,
    ])->assertCreated()->assertJsonPath('data.status', 'published');

    $this->withToken($this->token)->postJson('/api/v1/admin/news', [
        'type' => 'news', 'title' => 'Потом', 'body' => '<p>Текст</p>', 'is_published' => true,
        'published_at' => now()->addDays(2)->toIso8601String(),
    ])->assertCreated()->assertJsonPath('data.status', 'scheduled');

    $this->getJson('/api/v1/news/'.$now->json('data.slug'))->assertOk();
    $this->withToken($this->token)->getJson('/api/v1/admin/news?status=scheduled')->assertJsonPath('meta.total', 1);
});

it('removes dangerous html and keeps formatting', function () {
    $response = $this->withToken($this->token)->postJson('/api/v1/admin/news', [
        'type' => 'article', 'title' => 'Статья',
        'body' => '<h2>Заголовок</h2><p onclick="steal()">Текст <strong>жирный</strong> <a href="javascript:alert(1)">плохая</a> '
            .'<a href="https://bakht.uz">хорошая</a></p><script>alert("xss")</script><iframe src="https://evil.com"></iframe>'
            .'<ul><li>пункт</li></ul><img src="https://bakht.uz/a.jpg" onerror="hack()">',
    ])->assertCreated();

    $body = $response->json('data.body');

    expect($body)->toContain('<h2>Заголовок</h2>', '<strong>жирный</strong>', '<li>пункт</li>', 'href="https://bakht.uz"', 'rel="noopener noreferrer nofollow"')
        ->not->toContain('<script', 'onclick', 'onerror', 'javascript:', '<iframe');
});

it('rejects a body that is empty after cleaning', function () {
    $this->withToken($this->token)->postJson('/api/v1/admin/news', [
        'type' => 'news', 'title' => 'Пусто', 'body' => '<script>alert(1)</script>',
    ])->assertUnprocessable()->assertJsonValidationErrors('body');
});

it('links products in the given order and updates partially', function () {
    $first = Product::factory()->create(['name' => 'Первый']);
    $second = Product::factory()->create(['name' => 'Второй']);
    $news = News::factory()->create(['slug' => 'staryi-slug']);

    $this->withToken($this->token)->patchJson("/api/v1/admin/news/{$news->id}", [
        'title' => 'Новый заголовок', 'product_ids' => [$second->id, $first->id], 'is_pinned' => true,
    ])
        ->assertOk()
        ->assertJsonPath('data.title', 'Новый заголовок')
        ->assertJsonPath('data.slug', 'staryi-slug')
        ->assertJsonPath('data.is_pinned', true)
        ->assertJsonPath('data.products.0.name', 'Второй')
        ->assertJsonPath('data.products.1.name', 'Первый');

    $this->withToken($this->token)->patchJson("/api/v1/admin/news/{$news->id}", ['product_ids' => [999999]])
        ->assertUnprocessable();
});

it('uploads a cover and a gallery with webp previews', function () {
    Storage::fake('public');
    $news = News::factory()->create();

    $this->withToken($this->token)
        ->post("/api/v1/admin/news/{$news->id}/cover", ['image' => UploadedFile::fake()->image('cover.jpg', 1600, 1000)])
        ->assertOk()
        ->assertJsonPath('data.cover.card', fn (string $url) => str_ends_with($url, '.webp'));

    $response = $this->withToken($this->token)
        ->post("/api/v1/admin/news/{$news->id}/gallery", ['images' => [
            UploadedFile::fake()->image('1.jpg', 800, 600), UploadedFile::fake()->image('2.png', 800, 600),
        ]])
        ->assertOk()
        ->assertJsonCount(2, 'data.gallery');

    $mediaId = $response->json('data.gallery.0.id');
    $this->withToken($this->token)->deleteJson("/api/v1/admin/news/{$news->id}/gallery/{$mediaId}")->assertNoContent();
    $this->withToken($this->token)->deleteJson("/api/v1/admin/news/{$news->id}/cover")->assertNoContent();

    expect($news->refresh()->getMedia(News::GALLERY_COLLECTION))->toHaveCount(1)
        ->and($news->getMedia(News::COVER_COLLECTION))->toHaveCount(0);
});

it('soft deletes news', function () {
    $news = News::factory()->create();

    $this->withToken($this->token)->deleteJson("/api/v1/admin/news/{$news->id}")->assertNoContent();

    expect(News::withTrashed()->find($news->id)->trashed())->toBeTrue();
    $this->getJson("/api/v1/news/{$news->slug}")->assertNotFound();
});
