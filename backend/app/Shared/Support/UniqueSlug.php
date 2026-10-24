<?php

declare(strict_types=1);

namespace App\Shared\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Latin slug from a Russian name: "Цемент М500" → "tsement-m500", "tsement-m500-2", ...
 */
final class UniqueSlug
{
    /**
     * @param  class-string<Model>  $modelClass
     */
    public static function for(string $modelClass, string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source, '-', 'ru') ?: 'item';
        $base = Str::limit($base, 120, '');

        $slug = $base;
        $suffix = 2;

        while (self::exists($modelClass, $slug, $ignoreId)) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private static function exists(string $modelClass, string $slug, ?int $ignoreId): bool
    {
        // Without global scopes: slugs of soft-deleted rows are still taken (unique index).
        return (new $modelClass)->newQueryWithoutScopes()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists();
    }
}
