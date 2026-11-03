<?php

declare(strict_types=1);

namespace App\Modules\News\Providers;

use App\Modules\News\Models\News;
use App\Shared\Providers\ModuleServiceProvider;
use App\Shared\Support\PublicCache;

final class NewsServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        News::saved(fn () => PublicCache::flush());
        News::deleted(fn () => PublicCache::flush());
    }
}
