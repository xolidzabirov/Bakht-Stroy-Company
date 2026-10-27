<?php

use App\Modules\Auth\Support\RegistrationTicket;

/**
 * The last registration step with a valid pass: only the password rules are checked here.
 */
function registrationAttempt(object $test, array $overrides)
{
    return $test->postJson('/api/v1/auth/register', array_merge([
        'registration_token' => RegistrationTicket::issue('+992931234567'),
        'first_name' => 'Новый',
        'last_name' => 'Покупатель',
        'customer_type' => 'person',
        'email' => 'new.client@gmail.com',
        'password' => 'Stroy2026!',
        'password_confirmation' => 'Stroy2026!',
    ], $overrides));
}

it('requires a reasonable password', function (string $password, string $hint) {
    registrationAttempt($this, ['password' => $password, 'password_confirmation' => $password])
        ->assertUnprocessable()
        ->assertJsonPath('errors.password.0', fn (string $message) => str_contains(mb_strtolower($message), $hint));
})->with([
    'shorter than 8' => ['Ab1!', '8'],
    'only letters' => ['Stroymaterial', 'цифр'],
    'only digits' => ['1234567890', 'букв'],
    'common password' => ['Qwerty123', 'простой'],
    'contains the email' => ['newclient2026', 'email'],
]);

it('accepts passwords with letters and digits, symbols are optional', function (string $password) {
    registrationAttempt($this, ['password' => $password, 'password_confirmation' => $password])->assertCreated();
})->with(['Stroy2026', 'Stroy2026!', 'кирпич2026']);
