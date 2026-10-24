<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Database\Factories;

use App\Modules\Catalog\Enums\ProductUnit;
use App\Modules\Catalog\Models\Category;
use App\Modules\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = Str::ucfirst(fake()->unique()->words(3, true));

        return [
            'category_id' => Category::factory(),
            'name' => $name,
            'slug' => Str::slug($name, '-', 'ru').'-'.fake()->unique()->numberBetween(1, 999999),
            'sku' => 'BS-'.fake()->unique()->numerify('######'),
            'description' => fake()->paragraph(),
            'price' => fake()->numberBetween(10, 2000) * 1000,
            'old_price' => null,
            'unit' => fake()->randomElement(ProductUnit::cases()),
            'stock' => fake()->numberBetween(20, 500),
            'min_order_qty' => 1,
            'specs' => [['name' => 'Производитель', 'value' => fake()->company()]],
            'is_active' => true,
            'is_featured' => false,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => ['is_featured' => true]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock' => 0]);
    }

    public function discounted(int $oldPrice): static
    {
        return $this->state(fn (array $attributes) => ['old_price' => $oldPrice]);
    }
}
