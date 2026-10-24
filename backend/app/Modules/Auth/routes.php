<?php

use App\Modules\Auth\Http\Controllers\AuthController;
use App\Modules\Auth\Http\Controllers\PasswordResetController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('register/send-code', [AuthController::class, 'sendRegistrationCode'])->middleware('throttle:register-code')->name('register.send-code');
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
