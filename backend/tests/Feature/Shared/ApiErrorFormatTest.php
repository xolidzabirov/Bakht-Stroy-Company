<?php

use App\Shared\Exceptions\DomainException;
use Illuminate\Support\Facades\Route;

it('renders unknown api routes as NOT_FOUND json', function () {
    $this->getJson('/api/v1/does-not-exist')
        ->assertNotFound()
        ->assertExactJson([
            'message' => 'Ресурс не найден.',
            'code' => 'NOT_FOUND',
        ]);
});

it('renders domain exceptions with their code and status', function () {
    Route::get('/api/v1/_test/domain', fn () => throw new DomainException('Товар закончился', 'OUT_OF_STOCK', 409));

    $this->getJson('/api/v1/_test/domain')
        ->assertConflict()
        ->assertExactJson([
            'message' => 'Товар закончился',
            'code' => 'OUT_OF_STOCK',
        ]);
});

it('renders validation errors with VALIDATION_ERROR code', function () {
    Route::post('/api/v1/_test/validation', fn () => request()->validate(['name' => 'required']));

    $this->postJson('/api/v1/_test/validation')
        ->assertUnprocessable()
        ->assertJsonPath('code', 'VALIDATION_ERROR')
        ->assertJsonStructure(['message', 'code', 'errors' => ['name']]);
});

it('renders unauthenticated requests as 401', function () {
    Route::get('/api/v1/_test/private', fn () => 'secret')->middleware('auth:sanctum');

    $this->getJson('/api/v1/_test/private')
        ->assertUnauthorized()
        ->assertJsonPath('code', 'UNAUTHENTICATED');
});

it('returns readable utf-8 json without a json accept header', function () {
    $response = $this->get('/api/v1/does-not-exist');

    $response->assertNotFound()->assertHeader('Content-Type', 'application/json');
    expect($response->getContent())->toContain('Ресурс не найден.');
});
