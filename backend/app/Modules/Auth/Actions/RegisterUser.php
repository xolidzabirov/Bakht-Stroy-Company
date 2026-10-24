<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\Auth\DTO\RegisterData;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

final class RegisterUser
{
    public function __construct(private IssueToken $issueToken) {}

    public function handle(RegisterData $data): AuthResult
    {
        return DB::transaction(function () use ($data): AuthResult {
            $user = User::query()->create([
                'name' => $data->name,
                'phone' => $data->phone,
                'email' => $data->email,
                'password' => $data->password,
            ]);

            $user->assignRole(Role::Client);

            return $this->issueToken->handle($user, $data->deviceName);
        });
    }
}
