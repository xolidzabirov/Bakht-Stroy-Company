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
 * Last registration step: creates the account for the email confirmed with the code and signs the person in.
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
        $email = RegistrationTicket::email($data->registrationToken) ?? throw new RegistrationExpiredException;

        return DB::transaction(function () use ($data, $email): AuthResult {
            // The address and the number could be taken by someone else while this person was typing.
            if (User::withTrashed()->where('email', $email)->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['email' => 'Этот email уже зарегистрирован.']);
            }

            if (User::withTrashed()->where('phone', $data->phone)->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['phone' => 'Этот номер телефона уже привязан к другому аккаунту.']);
            }

            $user = User::query()->create([
                'name' => $data->name(),
                'email' => $email,
                'phone' => $data->phone,
                'password' => $data->password,
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();
            $user->assignRole(Role::Client);

            return $this->issueToken->handle($user, $data->deviceName);
        });
    }
}
