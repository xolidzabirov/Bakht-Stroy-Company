<?php

use App\Modules\Order\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Modules\Order\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('orders')->name('orders.')->group(function () {
    Route::get('/', [OrderController::class, 'index'])->name('index');
    // Placing and repeating orders is for customers; the shop team works in the admin panel.
    Route::post('/', [OrderController::class, 'store'])->middleware(['customer', 'throttle:orders'])->name('store');
    Route::get('{number}', [OrderController::class, 'show'])->name('show');
    Route::post('{number}/cancel', [OrderController::class, 'cancel'])->name('cancel');
    Route::post('{number}/repeat', [OrderController::class, 'repeat'])->middleware('customer')->name('repeat');
});

/*
| Admin panel — admins and managers.
*/
Route::prefix('admin/orders')->name('admin.orders.')->middleware(['auth:sanctum', 'active', 'role:admin|manager'])->group(function () {
    Route::get('/', [AdminOrderController::class, 'index'])->name('index');
    Route::get('{order}', [AdminOrderController::class, 'show'])->whereNumber('order')->name('show');
    Route::get('number/{number}', [AdminOrderController::class, 'showByNumber'])->name('show-by-number');
    Route::patch('{order}/status', [AdminOrderController::class, 'changeStatus'])->whereNumber('order')->name('status');
    Route::patch('{order}/payment', [AdminOrderController::class, 'changePayment'])->whereNumber('order')->name('payment');
});
