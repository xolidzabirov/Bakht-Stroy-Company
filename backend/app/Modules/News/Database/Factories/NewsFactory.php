<?php

declare(strict_types=1);

namespace App\Modules\News\Database\Factories;

use App\Modules\News\Enums\NewsType;
use App\Modules\News\Models\News;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<News>
 */
class NewsFactory extends Factory
{
    protected $model = News::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = Str::ucfirst(fake()->unique()->words(4, true));

        return [
            'type' => NewsType::News,
            'title' => $title,
            'slug' => Str::slug($title, '-', 'ru').'-'.fake()->unique()->numberBetween(1, 999999),
            'excerpt' => null,
            'body' => '<p>'.implode('</p><p>', fake()->paragraphs(3)).'</p>',
            'is_published' => true,
            'published_at' => now()->subDay(),
            'is_pinned' => false,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => ['is_published' => false, 'published_at' => null]);
    }

    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => ['is_published' => true, 'published_at' => now()->addDays(3)]);
    }

    public function pinned(): static
    {
        return $this->state(fn (array $attributes) => ['is_pinned' => true]);
    }

    public function type(NewsType $type): static
    {
        return $this->state(fn (array $attributes) => ['type' => $type]);
    }
}
