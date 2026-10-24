<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\Auth\DTO\RegisterData;
use App\Modules\Auth\Exceptions\InvalidVerificationCodeException;
use App\Modules\Auth\Support\VerificationCodes;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Step 2 of registration: creates the account only with a valid email code.
 */
final class RegisterUser
{
    public function __construct(private IssueToken $issueToken) {}

    public function handle(RegisterData $data): AuthResult
    {
        $codes = VerificationCodes::emailOwnership();

        if (! $codes->check($data->email, $data->code)) {
            throw new InvalidVerificationCodeException;
        }

        return DB::transaction(function () use ($data, $codes): AuthResult {
            $user = User::query()->create([
                'name' => $data->name,
                'email' => $data->email,
                'phone' => $data->phone,
                'password' => $data->password,
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();
            $user->assignRole(Role::Client);
            $codes->forget($data->email);

            return $this->issueToken->handle($user, $data->deviceName);
        });
    }
}
