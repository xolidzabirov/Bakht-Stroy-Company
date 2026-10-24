<?php

use App\Modules\Catalog\Enums\ProductUnit;
use App\Modules\Catalog\Models\Product;

it('calculates the discount percent', function (?int $oldPrice, ?int $expected) {
    $product = new Product(['price' => 85000, 'old_price' => $oldPrice]);

    expect($product->discountPercent())->toBe($expected);
})->with([
    'with discount' => [100000, 15],
    'no old price' => [null, null],
    'old price lower' => [80000, null],
]);

it('is in stock when stock covers the minimum order', function (int $stock, int $minOrder, bool $expected) {
    expect((new Product(['stock' => $stock, 'min_order_qty' => $minOrder]))->inStock())->toBe($expected);
})->with([
    [10, 1, true],
    [0, 1, false],
    [100, 500, false],
]);

it('has russian labels for every unit', function () {
    foreach (ProductUnit::cases() as $unit) {
        expect($unit->label())->not->toBeEmpty();
    }

    expect(ProductUnit::SquareMeter->label())->toBe('м²');
});
