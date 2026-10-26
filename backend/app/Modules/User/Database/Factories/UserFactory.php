<?php

declare(strict_types=1);

namespace App\Modules\User\Database\Factories;

use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+99293'.fake()->unique()->numerify('#######'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function withoutPhone(): static
    {
        return $this->state(fn (array $attributes) => ['phone' => null]);
    }

    public function blocked(): static
    {
        return $this->state(fn (array $attributes) => ['blocked_at' => now()]);
    }

    public function client(): static
    {
        return $this->withRole(Role::Client);
    }

    public function manager(): static
    {
        return $this->withRole(Role::Manager);
    }

    public function admin(): static
    {
        return $this->withRole(Role::Admin);
    }

    public function withRole(Role $role): static
    {
        return $this->afterCreating(fn (User $user) => $user->assignRole($role));
    }
}
