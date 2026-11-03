<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use App\Modules\Auth\Http\Controllers\PasswordResetController;
use App\Modules\Auth\Http\Controllers\TelegramWebhookController;
use Illuminate\Support\Facades\Route;

// Messages to @BakhtStroyBot (production; locally — php artisan telegram:poll).
Route::post('telegram/webhook', TelegramWebhookController::class)->name('telegram.webhook');

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('register/phone', [AuthController::class, 'checkPhone'])->middleware('throttle:register-phone')->name('register.phone');
    Route::post('register/email', [AuthController::class, 'sendEmailCode'])->middleware('throttle:register-code')->name('register.email');
    Route::post('register/email/verify', [AuthController::class, 'verifyEmail'])->middleware('throttle:register-verify')->name('register.email.verify');
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:register')->name('register');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login')->name('login');

    Route::middleware('throttle:password-reset')->group(function () {
        Route::post('forgot-password', [PasswordResetController::class, 'forgot'])->name('password.forgot');
        Route::post('reset-password', [PasswordResetController::class, 'reset'])->name('password.reset');
    });

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::post('logout-all', [AuthController::class, 'logoutAll'])->name('logout-all');
    });
});
