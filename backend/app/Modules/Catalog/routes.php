<?php

use App\Modules\Catalog\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Modules\Catalog\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Modules\Catalog\Http\Controllers\Admin\ProductImageController;
use App\Modules\Catalog\Http\Controllers\CategoryController;
use App\Modules\Catalog\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

/*
| Public catalog — available to guests.
*/
Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
Route::get('categories/{category:slug}', [CategoryController::class, 'show'])->name('categories.show');

Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/{product:slug}', [ProductController::class, 'show'])->name('products.show');
Route::get('products/{product:slug}/related', [ProductController::class, 'related'])->name('products.related');

/*
| Admin panel — admins.
*/
Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'active', 'role:admin|manager'])->group(function () {
    Route::patch('categories/reorder', [AdminCategoryController::class, 'reorder'])->name('categories.reorder');
    Route::post('categories/{category}/image', [AdminCategoryController::class, 'uploadImage'])->name('categories.image.store');
    Route::delete('categories/{category}/image', [AdminCategoryController::class, 'deleteImage'])->name('categories.image.destroy');
    Route::apiResource('categories', AdminCategoryController::class);

    Route::get('products/low-stock', [AdminProductController::class, 'lowStock'])->name('products.low-stock');
    Route::patch('products/{product}/stock', [AdminProductController::class, 'updateStock'])->name('products.stock');
    Route::post('products/{product}/images', [ProductImageController::class, 'store'])->name('products.images.store');
    Route::patch('products/{product}/images/order', [ProductImageController::class, 'reorder'])->name('products.images.reorder');
    Route::delete('products/{product}/images/{media}', [ProductImageController::class, 'destroy'])
        ->whereNumber('media')
        ->name('products.images.destroy');
    Route::apiResource('products', AdminProductController::class);
});
