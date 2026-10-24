<?php

use App\Modules\Cart\Http\Controllers\CartController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('cart')->name('cart.')->group(function () {
    Route::get('/', [CartController::class, 'show'])->name('show');
    Route::delete('/', [CartController::class, 'clear'])->name('clear');
    Route::post('items', [CartController::class, 'store'])->name('items.store');
    Route::patch('items/{item}', [CartController::class, 'update'])->whereNumber('item')->name('items.update');
    Route::delete('items/{item}', [CartController::class, 'destroy'])->whereNumber('item')->name('items.destroy');
});
