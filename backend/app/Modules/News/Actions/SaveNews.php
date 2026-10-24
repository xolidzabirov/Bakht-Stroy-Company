<?php

declare(strict_types=1);

namespace App\Modules\News\Actions;

use App\Modules\News\DTO\NewsData;
use App\Modules\News\Models\News;
use App\Modules\User\Models\User;
use App\Shared\Support\SafeHtml;
use App\Shared\Support\UniqueSlug;
use Illuminate\Support\Facades\DB;

/**
 * Creates or updates a news item: cleans the HTML, keeps the slug on rename,
 * sets the publication time when it is published without a date, links products.
 */
final class SaveNews
{
    public function handle(NewsData $data, ?News $news = null, ?User $author = null): News
    {
        return DB::transaction(function () use ($data, $news, $author): News {
            $news ??= new News(['author_id' => $author?->id]);

            $slugSource = $data->slug ?: ($news->exists ? null : $data->title);

            $news->fill([
                'type' => $data->type,
                'title' => $data->title,
                'excerpt' => $data->excerpt,
                'body' => SafeHtml::clean($data->body),
                'video_url' => $data->videoUrl,
                'is_published' => $data->isPublished,
                'published_at' => $data->isPublished ? ($data->publishedAt ?? $news->published_at ?? now()) : $data->publishedAt,
                'is_pinned' => $data->isPinned,
                'meta_title' => $data->metaTitle,
                'meta_description' => $data->metaDescription,
            ]);

            if ($slugSource !== null) {
                $news->slug = UniqueSlug::for(News::class, $slugSource, $news->exists ? $news->id : null);
            }

            $news->save();

            if ($data->productIds !== null) {
                $news->products()->sync(
                    collect($data->productIds)->values()->mapWithKeys(fn (int $id, int $index) => [$id => ['sort_order' => $index]])->all(),
                );
            }

            return $news->load(['media', 'author', 'products']);
        });
    }
}
