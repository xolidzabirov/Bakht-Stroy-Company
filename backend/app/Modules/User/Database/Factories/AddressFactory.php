<?php

declare(strict_types=1);

namespace App\Modules\User\Database\Factories;

use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->randomElement(['Дом', 'Объект', 'Дача', null]),
            'city' => 'Душанбе',
            'street' => 'ул. '.fake()->lastName(),
            'house' => (string) fake()->numberBetween(1, 200),
            'apartment' => (string) fake()->numberBetween(1, 120),
            'comment' => null,
            'is_default' => false,
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => ['is_default' => true]);
    }
}
