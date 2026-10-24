<?php

declare(strict_types=1);

namespace App\Modules\News\Support;

use App\Modules\News\Models\News;
use Illuminate\Database\Eloquent\Builder;

final class NewsSearch
{
    /**
     * Case-insensitive search in the title, excerpt and text.
     *
     * @param  Builder<News>  $query
     */
    public static function apply(Builder $query, ?string $search): void
    {
        if ($search === null || trim($search) === '') {
            return;
        }

        $like = '%'.addcslashes(mb_strtolower(trim($search)), '%_\\').'%';

        $query->where(fn (Builder $q) => $q
            ->whereRaw('lower(title) like ?', [$like])
            ->orWhereRaw('lower(excerpt) like ?', [$like])
            ->orWhereRaw('lower(body) like ?', [$like]));
    }
}
