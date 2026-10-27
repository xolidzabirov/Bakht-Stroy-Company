<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Modules\Auth\DTO\AuthResult;
use App\Modules\Auth\DTO\RegisterData;
use App\Modules\Auth\Exceptions\RegistrationExpiredException;
use App\Modules\Auth\Support\RegistrationTicket;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Last registration step: creates the account for the phone confirmed in Telegram and signs the person in.
 */
final class RegisterUser
{
    public function __construct(private IssueToken $issueToken) {}

    /**
     * @throws RegistrationExpiredException
     * @throws ValidationException
     */
    public function handle(RegisterData $data): AuthResult
    {
        $phone = RegistrationTicket::phone($data->registrationToken) ?? throw new RegistrationExpiredException;

        return DB::transaction(function () use ($data, $phone): AuthResult {
            // The number could be taken by someone else while this person was typing.
            if (User::withTrashed()->where('phone', $phone)->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['phone' => 'Этот номер телефона уже привязан к другому аккаунту.']);
            }

            $user = User::query()->create([
                'name' => $data->name(),
                'email' => $data->email,
                'phone' => $phone,
                'customer_type' => $data->customerType,
                'password' => $data->password,
            ]);

            $user->forceFill(['phone_verified_at' => now()])->save();
            $user->assignRole(Role::Client);

            return $this->issueToken->handle($user, $data->deviceName);
        });
    }
}
