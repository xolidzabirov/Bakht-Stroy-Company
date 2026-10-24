<?php

declare(strict_types=1);

namespace App\Modules\Content\Database\Factories;

use App\Modules\Content\Models\Banner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Banner>
 */
class BannerFactory extends Factory
{
    protected $model = Banner::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'subtitle' => fake()->sentence(8),
            'button_text' => 'Подробнее',
            'link' => '/catalog',
            'sort_order' => 0,
            'is_active' => true,
            'starts_at' => null,
            'ends_at' => null,
        ];
    }
}
