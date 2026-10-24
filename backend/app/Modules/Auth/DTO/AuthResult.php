<?php

declare(strict_types=1);

namespace App\Modules\Auth\DTO;

use App\Modules\User\Models\User;
use Illuminate\Support\Carbon;

final readonly class AuthResult
{
    public function __construct(
        public User $user,
        public string $token,
        public ?Carbon $expiresAt,
    ) {}
}
