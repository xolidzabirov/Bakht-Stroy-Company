<?php

use App\Modules\Account\Http\Controllers\AddressController;
use App\Modules\Account\Http\Controllers\NotificationController;
use App\Modules\Account\Http\Controllers\ProfileController;
use App\Modules\Account\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('me')->name('me.')->group(function () {
    Route::get('dashboard', [ProfileController::class, 'dashboard'])->name('dashboard');
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    Route::put('password', [ProfileController::class, 'changePassword'])->middleware('throttle:sensitive')->name('password');
    Route::post('email/send-code', [ProfileController::class, 'sendEmailCode'])->middleware('throttle:email-code')->name('email.send-code');
    Route::put('email', [ProfileController::class, 'changeEmail'])->middleware('throttle:sensitive')->name('email');

    Route::get('addresses', [AddressController::class, 'index'])->name('addresses.index');
    Route::post('addresses', [AddressController::class, 'store'])->name('addresses.store');
    Route::patch('addresses/{address}', [AddressController::class, 'update'])->whereNumber('address')->name('addresses.update');
    Route::post('addresses/{address}/default', [AddressController::class, 'makeDefault'])->whereNumber('address')->name('addresses.default');
    Route::delete('addresses/{address}', [AddressController::class, 'destroy'])->whereNumber('address')->name('addresses.destroy');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('notifications/{id}/read', [NotificationController::class, 'read'])->whereUuid('id')->name('notifications.read');

    Route::get('sessions', [SessionController::class, 'index'])->name('sessions.index');
    Route::delete('sessions/{id}', [SessionController::class, 'destroy'])->whereNumber('id')->name('sessions.destroy');
});
