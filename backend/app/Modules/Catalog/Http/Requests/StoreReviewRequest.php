<?php

declare(strict_types=1);

namespace App\Modules\Catalog\Http\Requests;

use App\Modules\Catalog\Models\Review;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class StoreReviewRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /**
             * Оценка: от 1 до 5 звёзд.
             *
             * @example 5
             */
            'rating' => ['required', 'integer', 'between:'.Review::MIN_RATING.','.Review::MAX_RATING],
            /**
             * Текст отзыва.
             *
             * @example Цемент свежий, привезли вовремя.
             */
            'body' => ['required', 'string', 'min:3', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rating.required' => 'Поставьте оценку от 1 до 5.',
            'rating.integer' => 'Поставьте оценку от 1 до 5.',
            'rating.between' => 'Поставьте оценку от 1 до 5.',
            'body.required' => 'Напишите, что вы думаете о товаре.',
            'body.min' => 'Напишите хотя бы несколько слов.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['rating' => 'оценка', 'body' => 'текст отзыва'];
    }
}
