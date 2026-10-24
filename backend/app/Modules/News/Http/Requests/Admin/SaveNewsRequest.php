<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Requests\Admin;

use App\Modules\News\DTO\NewsData;
use App\Modules\News\Enums\NewsType;
use App\Modules\News\Models\News;
use App\Shared\Support\SafeHtml;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Create (POST — type, title, body required) and partial update (PATCH).
 */
final class SaveNewsRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $news = $this->route('news');
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            /** news — новости компании, promo — акции, article — статьи и советы. */
            'type' => [$required, Rule::enum(NewsType::class)],
            /** @example Скидка 10% на цемент М500 до конца месяца */
            'title' => [$required, 'string', 'min:3', 'max:200'],
            /**
             * Латинский slug для URL. Если не указан — из заголовка.
             *
             * @example skidka-na-tsement
             */
            'slug' => ['sometimes', 'nullable', 'string', 'max:220', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('news', 'slug')->ignore($news instanceof News ? $news->id : null)],
            /** Краткое описание для карточки. Если пусто — первые 200 символов текста. */
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:500'],
            /**
             * Текст в HTML из редактора: p, h2, h3, strong, em, ul, ol, li, a, img, blockquote, table…
             * Скрипты, стили и опасные атрибуты удаляются.
             *
             * @example <h2>Акция</h2><p>Скидка <strong>10%</strong> на цемент М500.</p>
             */
            'body' => [$required, 'string', 'max:'.SafeHtml::MAX_LENGTH],
            /**
             * Ссылка на видео YouTube.
             *
             * @example https://www.youtube.com/watch?v=dQw4w9WgXcQ
             */
            'video_url' => ['sometimes', 'nullable', 'url:https', 'max:300'],
            /** Опубликовать. */
            'is_published' => ['sometimes', 'boolean'],
            /**
             * Дата публикации. В будущем — публикация по расписанию. Если опубликовано без даты — сейчас.
             *
             * @example 2026-11-01T09:00:00+05:00
             */
            'published_at' => ['sometimes', 'nullable', 'date'],
            /** Закрепить вверху списка. */
            'is_pinned' => ['sometimes', 'boolean'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:200'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:300'],
            /**
             * Товары внутри новости (порядок сохраняется).
             *
             * @example [2, 9]
             */
            'product_ids' => ['sometimes', 'array', 'max:24'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['slug.regex' => 'Slug может содержать только латинские буквы, цифры и дефис.'];
    }

    protected function passedValidation(): void
    {
        // A text that becomes empty after removing unsafe tags is not a text.
        if ($this->has('body') && SafeHtml::toText(SafeHtml::clean($this->input('body'))) === ''
            && ! str_contains(SafeHtml::clean($this->input('body')), '<img')) {
            throw ValidationException::withMessages(['body' => 'Текст новости пустой.']);
        }
    }

    public function toData(?News $news = null): NewsData
    {
        $value = fn (string $key, mixed $current) => $this->has($key) ? $this->input($key) : $current;

        return new NewsData(
            type: $this->has('type') ? NewsType::from($this->string('type')->toString()) : ($news->type ?? NewsType::News),
            title: trim((string) $value('title', $news?->title)),
            slug: $this->filled('slug') ? $this->string('slug')->toString() : null,
            excerpt: ($excerpt = $value('excerpt', $news?->excerpt)) !== null && trim((string) $excerpt) !== '' ? trim((string) $excerpt) : null,
            body: (string) $value('body', $news?->body),
            videoUrl: $value('video_url', $news?->video_url) ?: null,
            isPublished: $this->has('is_published') ? $this->boolean('is_published') : ($news->is_published ?? false),
            publishedAt: $this->has('published_at')
                ? ($this->filled('published_at') ? Carbon::parse($this->string('published_at')->toString()) : null)
                : $news?->published_at,
            isPinned: $this->has('is_pinned') ? $this->boolean('is_pinned') : ($news->is_pinned ?? false),
            metaTitle: $value('meta_title', $news?->meta_title) ?: null,
            metaDescription: $value('meta_description', $news?->meta_description) ?: null,
            productIds: $this->has('product_ids') ? array_values(array_map('intval', $this->array('product_ids'))) : null,
        );
    }
}
