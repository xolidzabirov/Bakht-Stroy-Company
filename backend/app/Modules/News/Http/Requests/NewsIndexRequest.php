<?php

declare(strict_types=1);

namespace App\Modules\News\Http\Requests;

use App\Modules\News\Enums\NewsType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NewsIndexRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** news — новости компании, promo — акции, article — статьи и советы. */
            'type' => ['nullable', Rule::enum(NewsType::class)],
            /**
             * Поиск по заголовку и тексту.
             *
             * @example цемент
             */
            'search' => ['nullable', 'string', 'max:100'],
            /** @example 12 */
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
