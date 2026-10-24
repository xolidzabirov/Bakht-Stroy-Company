<?php

use App\Modules\Favorite\Http\Controllers\FavoriteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->prefix('favorites')->name('favorites.')->group(function () {
    Route::get('/', [FavoriteController::class, 'index'])->name('index');
    Route::post('{product}', [FavoriteController::class, 'store'])->whereNumber('product')->name('store');
    Route::delete('{product}', [FavoriteController::class, 'destroy'])->whereNumber('product')->name('destroy');
});
