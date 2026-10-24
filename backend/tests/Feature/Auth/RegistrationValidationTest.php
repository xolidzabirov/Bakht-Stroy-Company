<?php

use App\Modules\Auth\Support\VerificationCodes;

function registrationAttempt(object $test, array $overrides)
{
    $code = VerificationCodes::emailOwnership()->issue('new.client@gmail.com');

    return $test->postJson('/api/v1/auth/register', array_merge([
        'name' => 'Новый покупатель',
        'email' => 'new.client@gmail.com',
        'code' => $code,
        'password' => 'Stroy2026!',
        'password_confirmation' => 'Stroy2026!',
    ], $overrides));
}

it('accepts real phone numbers with a country code in any notation', function (string $phone, string $stored) {
    registrationAttempt($this, ['phone' => $phone])
        ->assertCreated()
        ->assertJsonPath('data.user.phone', $stored);
})->with([
    'uzbek mobile' => ['+998 90 123-45-67', '+998901234567'],
    'with 00' => ['00998 93 765 43 21', '+998937654321'],
    'without plus' => ['998 99 123 45 67', '+998991234567'],
    'tajik mobile' => ['+992 93 123 4567', '+992931234567'],
    'russian mobile' => ['+7 916 123-45-67', '+79161234567'],
]);

it('rejects phones without a country code, wrong or fake numbers with a friendly message', function (string $phone, string $message) {
    registrationAttempt($this, ['phone' => $phone])
        ->assertUnprocessable()
        ->assertJsonPath('errors.phone.0', $message);
})->with([
    'no country code' => ['90 123 45 67', 'Укажите номер с кодом страны, например +998 90 123 45 67.'],
    'too short' => ['+998 90 123', 'Такого номера не существует. Проверьте, пожалуйста, код страны и цифры.'],
    'not existing operator code' => ['+998 00 123 45 67', 'Такого номера не существует. Проверьте, пожалуйста, код страны и цифры.'],
    'letters' => ['+998 ab cd', 'Проверьте, пожалуйста, номер — кажется, в нём ошибка.'],
    'all same digits' => ['+998 99 999 99 99', 'Похоже, это не настоящий номер. Укажите номер, по которому с вами можно связаться.'],
    'zero subscriber' => ['+998 90 000 00 00', 'Похоже, это не настоящий номер. Укажите номер, по которому с вами можно связаться.'],
]);

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
