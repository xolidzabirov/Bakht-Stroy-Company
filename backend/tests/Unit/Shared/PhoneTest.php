<?php

use App\Shared\Support\Phone;
use Tests\TestCase;

uses(TestCase::class);

it('normalizes phone input to E.164', function (string $input, string $expected) {
    config(['shop.phone.default_country_code' => '998']);

    expect(Phone::normalize($input))->toBe($expected);
})->with([
    'already e164' => ['+998901234567', '+998901234567'],
    'with spaces and dashes' => ['+998 90 123-45-67', '+998901234567'],
    'international 00 prefix' => ['00998901234567', '+998901234567'],
    'local 9 digits' => ['90 123 45 67', '+998901234567'],
    'trunk prefix 8' => ['8 (90) 123-45-67', '+998901234567'],
    'country code without plus' => ['998901234567', '+998901234567'],
    'tajik number' => ['+992 93 123 4567', '+992931234567'],
]);

it('validates E.164 numbers', function () {
    expect(Phone::isValid('+998901234567'))->toBeTrue()
        ->and(Phone::isValid('+99890'))->toBeFalse()
        ->and(Phone::isValid('998901234567'))->toBeFalse()
        ->and(Phone::isValid('hello'))->toBeFalse();
});
