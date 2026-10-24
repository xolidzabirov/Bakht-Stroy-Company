<?php

use App\Modules\Content\Models\Banner;
use App\Modules\Content\Models\ContactMessage;
use App\Modules\Content\Notifications\NewContactMessageNotification;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->token = $this->admin->createToken('Pest')->plainTextToken;
});

it('shows only active banners within their period, in order', function () {
    Banner::factory()->create(['title' => 'Второй', 'sort_order' => 2]);
    Banner::factory()->create(['title' => 'Первый', 'sort_order' => 1]);
    Banner::factory()->create(['title' => 'Скрытый', 'is_active' => false]);
    Banner::factory()->create(['title' => 'Будущий', 'starts_at' => now()->addDay()]);
    Banner::factory()->create(['title' => 'Прошедший', 'ends_at' => now()->subDay()]);

    expect(collect($this->getJson('/api/v1/banners')->assertOk()->json('data'))->pluck('title')->all())
        ->toBe(['Первый', 'Второй']);
});

it('manages banners with images', function () {
    Storage::fake('public');

    $id = $this->withToken($this->token)->postJson('/api/v1/admin/banners', [
        'title' => 'Скидка на кровлю', 'link' => '/catalog/krovlya', 'button_text' => 'Смотреть',
    ])->assertCreated()->json('data.id');

    $this->withToken($this->token)
        ->post("/api/v1/admin/banners/{$id}/image", ['image' => UploadedFile::fake()->image('b.jpg', 2400, 800)])
        ->assertOk()
        ->assertJsonPath('data.image', fn (string $url) => str_contains($url, 'desktop') && str_ends_with($url, '.webp'))
        ->assertJsonPath('data.image_mobile', fn (string $url) => str_contains($url, 'mobile'));

    $this->withToken($this->token)->patchJson("/api/v1/admin/banners/{$id}", ['is_active' => false])
        ->assertOk()->assertJsonPath('data.is_active', false);
    $this->withToken($this->token)->postJson('/api/v1/admin/banners', ['title' => 'X', 'link' => 'javascript:alert(1)'])
        ->assertUnprocessable()->assertJsonValidationErrors('link');
    $this->withToken($this->token)->deleteJson("/api/v1/admin/banners/{$id}")->assertNoContent();

    expect(Banner::query()->count())->toBe(0);
});

it('accepts contact messages from guests and notifies staff', function () {
    Notification::fake();

    $this->postJson('/api/v1/contact', [
        'name' => 'Сардор', 'phone' => '90 123 45 67', 'message' => 'Сколько стоит доставка щебня в Чирчик?',
    ])->assertCreated();

    $message = ContactMessage::query()->sole();

    expect($message->phone)->toBe('+998901234567')->and($message->user_id)->toBeNull();
    Notification::assertSentTo($this->admin, NewContactMessageNotification::class);
});

it('remembers the account of a logged-in sender', function () {
    $client = User::factory()->client()->create();

    $this->withToken($client->createToken('Pest')->plainTextToken)
        ->postJson('/api/v1/contact', ['name' => 'Клиент', 'phone' => '+998901234567', 'message' => 'Вопрос по заказу'])
        ->assertCreated();

    expect(ContactMessage::query()->sole()->user_id)->toBe($client->id);
});

it('limits contact messages to 5 per hour', function () {
    foreach (range(1, 5) as $i) {
        $this->postJson('/api/v1/contact', ['name' => 'Спамер', 'phone' => '+998901234567', 'message' => "Сообщение {$i}"])->assertCreated();
    }

    $this->postJson('/api/v1/contact', ['name' => 'Спамер', 'phone' => '+998901234567', 'message' => 'Ещё одно'])->assertTooManyRequests();
});

it('lets staff read and delete messages', function () {
    $first = ContactMessage::query()->create(['name' => 'А', 'phone' => '+998901234567', 'message' => 'Первое']);
    ContactMessage::query()->create(['name' => 'Б', 'phone' => '+998901234567', 'message' => 'Второе']);

    $this->withToken($this->token)->getJson('/api/v1/admin/messages')
        ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.unread_count', 2);

    $this->withToken($this->token)->patchJson("/api/v1/admin/messages/{$first->id}/read")->assertOk()->assertJsonPath('data.is_read', true);
    $this->withToken($this->token)->getJson('/api/v1/admin/messages?unread=1')->assertJsonCount(1, 'data');
    $this->withToken($this->token)->deleteJson("/api/v1/admin/messages/{$first->id}")->assertNoContent();

    $this->app['auth']->forgetGuards();
    $this->withToken(User::factory()->client()->create()->createToken('Pest')->plainTextToken)
        ->getJson('/api/v1/admin/messages')->assertForbidden();
});
