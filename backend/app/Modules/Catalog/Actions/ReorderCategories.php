<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Actions;

use App\Modules\Catalog\Models\Category;
use Illuminate\Support\Facades\DB;

final class ReorderCategories
{
    /**
     * @param  list<array{id: int, sort_order: int}>  $items
     */
    public function handle(array $items): void
    {
        DB::transaction(function () use ($items): void {
            foreach ($items as $item) {
                Category::query()->whereKey($item['id'])->update(['sort_order' => $item['sort_order']]);
            }
        });
    }
}
