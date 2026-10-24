<?php

use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function staffToken(string $role = 'admin'): string
{
    return User::factory()->{$role}()->create()->createToken('Pest')->plainTextToken;
}

it('is closed for guests and clients', function () {
    $this->getJson('/api/v1/admin/categories')->assertUnauthorized();

    $this->withToken(staffToken('client'))
        ->postJson('/api/v1/admin/categories', ['name' => 'Тест'])
        ->assertForbidden()
        ->assertJsonPath('code', 'FORBIDDEN');
});

it('lists all categories including hidden ones', function () {
    $root = Category::factory()->create(['name' => 'Кровля']);
    Category::factory()->childOf($root)->inactive()->create(['name' => 'Шифер']);
    Product::factory()->for($root)->inactive()->create();

    $response = $this->withToken(staffToken('admin'))->getJson('/api/v1/admin/categories')->assertOk();

    expect($response->json('data.0.children.0.name'))->toBe('Шифер')
        ->and($response->json('data.0.children.0.is_active'))->toBeFalse()
        ->and($response->json('data.0.products_count'))->toBe(1);
});

it('creates a category with a generated latin slug', function () {
    $this->withToken(staffToken())
        ->postJson('/api/v1/admin/categories', ['name' => 'Сухие смеси', 'description' => 'Для отделки'])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'suhie-smesi')
        ->assertJsonPath('data.is_active', true)
        ->assertJsonPath('data.parent_id', null);

    $this->withToken(staffToken())
        ->postJson('/api/v1/admin/categories', ['name' => 'Сухие смеси'])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'suhie-smesi-2');
});

it('creates a subcategory', function () {
    $root = Category::factory()->create();

    $this->withToken(staffToken())
        ->postJson('/api/v1/admin/categories', ['name' => 'Арматура', 'parent_id' => $root->id])
        ->assertCreated()
        ->assertJsonPath('data.parent.id', $root->id);
});

it('keeps the tree two-level', function () {
    $root = Category::factory()->create();
    $child = Category::factory()->childOf($root)->create();
    $otherRoot = Category::factory()->create();
    $token = staffToken();

    // a subcategory cannot be a parent
    $this->withToken($token)
        ->postJson('/api/v1/admin/categories', ['name' => 'Третий уровень', 'parent_id' => $child->id])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_CATEGORY_PARENT');

    // a category with children cannot become a subcategory
    $this->withToken($token)
        ->patchJson("/api/v1/admin/categories/{$root->id}", ['parent_id' => $otherRoot->id])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'INVALID_CATEGORY_PARENT');

    // a category cannot be its own parent
    $this->withToken($token)
        ->patchJson("/api/v1/admin/categories/{$otherRoot->id}", ['parent_id' => $otherRoot->id])
        ->assertUnprocessable();
});

it('updates only the sent fields and keeps the slug on rename', function () {
    $category = Category::factory()->create(['name' => 'Кирпич', 'slug' => 'kirpich', 'sort_order' => 5]);

    $this->withToken(staffToken())
        ->patchJson("/api/v1/admin/categories/{$category->id}", ['name' => 'Кирпич и блоки', 'is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.name', 'Кирпич и блоки')
        ->assertJsonPath('data.slug', 'kirpich')
        ->assertJsonPath('data.sort_order', 5)
        ->assertJsonPath('data.is_active', false);
});

it('changes the slug when it is sent explicitly', function () {
    $category = Category::factory()->create(['slug' => 'old']);
    Category::factory()->create(['slug' => 'taken']);
    $token = staffToken();

    $this->withToken($token)->patchJson("/api/v1/admin/categories/{$category->id}", ['slug' => 'new-slug'])
        ->assertOk()->assertJsonPath('data.slug', 'new-slug');

    $this->withToken($token)->patchJson("/api/v1/admin/categories/{$category->id}", ['slug' => 'taken'])
        ->assertUnprocessable()->assertJsonValidationErrors('slug');

    $this->withToken($token)->patchJson("/api/v1/admin/categories/{$category->id}", ['slug' => 'Кириллица'])
        ->assertUnprocessable()->assertJsonValidationErrors('slug');
});

it('deletes only empty categories', function () {
    $withProducts = Category::factory()->create();
    Product::factory()->for($withProducts)->create();
    $withChildren = Category::factory()->create();
    Category::factory()->childOf($withChildren)->create();
    $empty = Category::factory()->create();
    $token = staffToken();

    $this->withToken($token)->deleteJson("/api/v1/admin/categories/{$withProducts->id}")
        ->assertConflict()->assertJsonPath('code', 'CATEGORY_NOT_EMPTY');
    $this->withToken($token)->deleteJson("/api/v1/admin/categories/{$withChildren->id}")
        ->assertConflict();
    $this->withToken($token)->deleteJson("/api/v1/admin/categories/{$empty->id}")
        ->assertNoContent();

    expect(Category::query()->find($empty->id))->toBeNull();
});

it('reorders categories', function () {
    $first = Category::factory()->create(['sort_order' => 0]);
    $second = Category::factory()->create(['sort_order' => 1]);

    $this->withToken(staffToken())
        ->patchJson('/api/v1/admin/categories/reorder', ['items' => [
            ['id' => $first->id, 'sort_order' => 1],
            ['id' => $second->id, 'sort_order' => 0],
        ]])
        ->assertNoContent();

    expect($first->refresh()->sort_order)->toBe(1)->and($second->refresh()->sort_order)->toBe(0);
});

it('uploads and removes a category image', function () {
    Storage::fake('public');
    $category = Category::factory()->create();
    $token = staffToken();

    $this->withToken($token)
        ->post("/api/v1/admin/categories/{$category->id}/image", ['image' => UploadedFile::fake()->image('cement.jpg', 800, 600)])
        ->assertOk()
        ->assertJsonPath('data.image', fn (string $url) => str_contains($url, 'thumb') && str_ends_with($url, '.webp'));

    $this->withToken($token)
        ->post("/api/v1/admin/categories/{$category->id}/image", ['image' => UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf')])
        ->assertUnprocessable();

    $this->withToken($token)->deleteJson("/api/v1/admin/categories/{$category->id}/image")->assertNoContent();

    expect($category->refresh()->getMedia(Category::IMAGE_COLLECTION))->toHaveCount(0);
});
