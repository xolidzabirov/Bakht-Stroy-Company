<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\Auth\DTO\LoginData;
use App\Modules\Auth\Exceptions\InvalidCredentialsException;
use App\Modules\User\Exceptions\AccountBlockedException;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\Hash;

final class LoginUser
{
    public function __construct(private IssueToken $issueToken) {}

    public function handle(LoginData $data): AuthResult
    {
        $user = User::query()->byEmail($data->email)->first();

        if ($user === null || ! Hash::check($data->password, $user->password)) {
            throw new InvalidCredentialsException;
        }

        if ($user->isBlocked()) {
            throw new AccountBlockedException;
        }

        return $this->issueToken->handle($user, $data->deviceName);
    }
}
