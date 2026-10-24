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
            'phone' => '+99890'.fake()->unique()->numerify('#######'),
            'email' => fake()->unique()->safeEmail(),
            'phone_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function withoutEmail(): static
    {
        return $this->state(fn (array $attributes) => ['email' => null]);
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
