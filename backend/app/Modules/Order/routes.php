<?php

use App\Modules\Order\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('orders')->name('orders.')->group(function () {
    Route::get('/', [OrderController::class, 'index'])->name('index');
    Route::post('/', [OrderController::class, 'store'])->middleware('throttle:orders')->name('store');
    Route::get('{number}', [OrderController::class, 'show'])->name('show');
    Route::post('{number}/cancel', [OrderController::class, 'cancel'])->name('cancel');
    Route::post('{number}/repeat', [OrderController::class, 'repeat'])->name('repeat');
});
