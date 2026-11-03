<?php

declare(strict_types=1);

namespace App\Shared\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Keys of the cached public answers (Http\Middleware\CachePublicResponse).
 * All of them carry one version: a new version drops everything at once, whichever store is in use.
 */
final class PublicCache
{
    private const VERSION_KEY = 'public-cache:version';

    public static function key(Request $request): string
    {
        $version = Cache::rememberForever(self::VERSION_KEY, fn (): string => Str::random(8));
        $query = $request->query();
        ksort($query);

        return 'public-cache:'.$version.':'.sha1($request->path().'?'.http_build_query($query));
    }

    /**
     * Call when anything the shop shows changes.
     */
    public static function flush(): void
    {
        Cache::forever(self::VERSION_KEY, Str::random(8));

        // Answers of the old version are never read again, and the database store removes a row only when it is read.
        if (config('cache.default') === 'database') {
            DB::table((string) config('cache.stores.database.table', 'cache'))->where('expiration', '<=', now()->getTimestamp())->delete();
        }
    }
}
