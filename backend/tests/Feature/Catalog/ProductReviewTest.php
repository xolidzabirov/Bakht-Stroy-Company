<?php

use App\Modules\Catalog\Models\Product;
use App\Modules\Catalog\Models\Review;
use App\Modules\User\Models\User;

beforeEach(function () {
    $this->customer = User::factory()->client()->create(['name' => 'Халид Забиров']);
    $this->token = $this->customer->createToken('Pest')->plainTextToken;
    $this->product = Product::factory()->create(['slug' => 'tsement-m500']);
});

function postReview(object $test, array $body, ?string $token = null)
{
    return $test->withToken($token ?? $test->token)->postJson('/api/v1/products/tsement-m500/reviews', $body);
}

it('publishes a review with stars and text and shows it on the product', function () {
    postReview($this, ['rating' => 5, 'body' => '  Цемент свежий, привезли вовремя.  '])
        ->assertCreated()
        ->assertJsonPath('data.rating', 5)
        ->assertJsonPath('data.body', 'Цемент свежий, привезли вовремя.')
        ->assertJsonPath('data.author', 'Халид З.');

    $this->product->refresh();
    expect($this->product->reviews_count)->toBe(1)->and($this->product->rating)->toBe(5.0);

    $this->getJson('/api/v1/products/tsement-m500')
        ->assertJsonPath('data.reviews_count', 1)
        ->assertJsonPath('data.rating', 5);
});

it('asks for both the stars and the text', function () {
    postReview($this, ['body' => 'Хороший цемент'])->assertUnprocessable()->assertJsonValidationErrors('rating');
    postReview($this, ['rating' => 4])->assertUnprocessable()->assertJsonValidationErrors('body');
    postReview($this, ['rating' => 4, 'body' => '   '])->assertUnprocessable()->assertJsonValidationErrors('body');

    expect(Review::query()->count())->toBe(0);
});

it('takes only from one to five stars', function (mixed $rating) {
    postReview($this, ['rating' => $rating, 'body' => 'Хороший цемент'])->assertUnprocessable()->assertJsonValidationErrors('rating');
})->with([0, 6, -1, 'много', 3.5]);

it('keeps one review per customer: writing again changes it', function () {
    postReview($this, ['rating' => 2, 'body' => 'Сначала не понравилось'])->assertCreated();
    postReview($this, ['rating' => 4, 'body' => 'Потом разобрался'])->assertOk();

    expect(Review::query()->count())->toBe(1)
        ->and(Review::query()->sole()->rating)->toBe(4)
        ->and($this->product->refresh()->rating)->toBe(4.0);
});

it('counts the average of all customers', function () {
    Review::factory()->for($this->product)->create(['rating' => 5]);
    Review::factory()->for($this->product)->create(['rating' => 2]);

    postReview($this, ['rating' => 4, 'body' => 'Нормальный цемент'])->assertCreated();

    expect($this->product->refresh()->reviews_count)->toBe(3)->and($this->product->rating)->toBe(3.67);
});

it('shows reviews to guests with a summary, newest first, without private data', function () {
    Review::factory()->for($this->product)->create(['rating' => 5, 'body' => 'Первый']);
    Review::factory()->for($this->product)->create(['rating' => 1, 'body' => 'Второй']);

    $response = $this->getJson('/api/v1/products/tsement-m500/reviews')
        ->assertOk()
        ->assertJsonPath('data.0.body', 'Второй')
        ->assertJsonPath('summary.count', 2)
        ->assertJsonPath('summary.average', 3)
        ->assertJsonPath('summary.stars.5', 1)
        ->assertJsonPath('summary.stars.1', 1)
        ->assertJsonPath('summary.stars.3', 0);

    expect($response->json('data.0'))->not->toHaveKeys(['user_id', 'email', 'phone']);
});

it('closes writing to guests and to the shop team', function () {
    $this->postJson('/api/v1/products/tsement-m500/reviews', ['rating' => 5, 'body' => 'Хороший цемент'])->assertUnauthorized();

    $manager = User::factory()->manager()->create();
    postReview($this, ['rating' => 5, 'body' => 'Хороший цемент'], $manager->createToken('Pest')->plainTextToken)->assertForbidden();

    expect(Review::query()->count())->toBe(0);
});

it('does not take reviews for a hidden product', function () {
    $this->product->update(['is_active' => false]);

    postReview($this, ['rating' => 5, 'body' => 'Хороший цемент'])->assertNotFound();
    $this->getJson('/api/v1/products/tsement-m500/reviews')->assertNotFound();
});

it('tells a customer their own review', function () {
    $this->withToken($this->token)->getJson('/api/v1/products/tsement-m500/reviews/mine')->assertOk()->assertJsonPath('data', null);

    postReview($this, ['rating' => 3, 'body' => 'Нормальный цемент'])->assertCreated();

    $this->withToken($this->token)->getJson('/api/v1/products/tsement-m500/reviews/mine')->assertOk()->assertJsonPath('data.rating', 3);
});

it('lets the shop team read all reviews with their authors and filter the negative ones', function () {
    $staff = User::factory()->manager()->create()->createToken('Pest')->plainTextToken;
    Review::factory()->for($this->product)->create(['rating' => 1, 'body' => 'Плохо']);
    Review::factory()->for($this->product)->create(['rating' => 2, 'body' => 'Так себе']);
    Review::factory()->for($this->product)->for($this->customer)->create(['rating' => 5, 'body' => 'Отлично']);

    $all = $this->withToken($staff)->getJson("/api/v1/admin/products/{$this->product->id}/reviews")->assertOk();
    expect($all->json('data'))->toHaveCount(3)
        ->and($all->json('summary.count'))->toBe(3)
        ->and($all->json('data.0.author.name'))->toBe('Халид Забиров')
        ->and($all->json('data.0.author.email'))->toBe($this->customer->email);

    $negative = $this->withToken($staff)->getJson("/api/v1/admin/products/{$this->product->id}/reviews?filter=negative")->assertOk();
    expect($negative->json('data'))->toHaveCount(2);

    $positive = $this->withToken($staff)->getJson("/api/v1/admin/products/{$this->product->id}/reviews?filter=positive")->assertOk();
    expect($positive->json('data'))->toHaveCount(1);
});

it('lets the shop team delete a review and counts the stars again', function () {
    $staff = User::factory()->manager()->create()->createToken('Pest')->plainTextToken;
    $bad = Review::factory()->for($this->product)->create(['rating' => 1]);
    Review::factory()->for($this->product)->create(['rating' => 5]);
    $this->product->refresh();

    $this->withToken($staff)->deleteJson("/api/v1/admin/reviews/{$bad->id}")->assertNoContent();

    expect(Review::query()->count())->toBe(1);
});

it('brings the stars of a product back to nothing with its last review', function () {
    $staff = User::factory()->manager()->create()->createToken('Pest')->plainTextToken;
    postReview($this, ['rating' => 1, 'body' => 'Плохой цемент'])->assertCreated();

    $this->app['auth']->forgetGuards();
    $this->withToken($staff)->deleteJson('/api/v1/admin/reviews/'.Review::query()->sole()->id)->assertNoContent();

    $this->product->refresh();
    expect($this->product->reviews_count)->toBe(0)->and($this->product->rating)->toBeNull();
});

it('keeps customers away from the moderation', function () {
    $review = Review::factory()->for($this->product)->create();

    $this->withToken($this->token)->getJson("/api/v1/admin/products/{$this->product->id}/reviews")->assertForbidden();
    $this->withToken($this->token)->deleteJson("/api/v1/admin/reviews/{$review->id}")->assertForbidden();

    expect(Review::query()->count())->toBe(1);
});

it('keeps a review anonymous after its author deleted the account', function () {
    $review = Review::factory()->for($this->product)->for($this->customer)->create();
    $this->customer->delete();

    $this->getJson('/api/v1/products/tsement-m500/reviews')->assertOk()->assertJsonPath('data.0.id', $review->id)->assertJsonPath('data.0.author', null);
});
