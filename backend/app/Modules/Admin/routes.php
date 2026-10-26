<?php

use App\Modules\Admin\Http\Controllers\StatsController;
use App\Modules\Admin\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'active', 'role:admin|manager'])->group(function () {
    Route::get('stats', StatsController::class)->name('stats');

    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/{user}', [UserController::class, 'show'])->whereNumber('user')->name('users.show');

    // Admin only: blocking and roles.
    Route::middleware('role:admin')->group(function () {
        Route::patch('users/{user}/block', [UserController::class, 'block'])->whereNumber('user')->name('users.block');
        Route::patch('users/{user}/unblock', [UserController::class, 'unblock'])->whereNumber('user')->name('users.unblock');
        Route::patch('users/{user}/role', [UserController::class, 'changeRole'])->whereNumber('user')->name('users.role');
    });
});
