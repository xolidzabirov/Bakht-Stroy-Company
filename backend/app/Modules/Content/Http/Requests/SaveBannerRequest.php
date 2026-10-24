<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class SaveBannerRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            /** @example Сезонная скидка на кровлю до −15% */
            'title' => [$required, 'string', 'max:150'],
            /** @example Профнастил и металлочерепица со склада в Ташкенте */
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:300'],
            /** @example Смотреть товары */
            'button_text' => ['sometimes', 'nullable', 'string', 'max:50'],
            /**
             * Ссылка: относительная (/catalog/krovlya) или https.
             *
             * @example /catalog/krovlya
             */
            'link' => ['sometimes', 'nullable', 'string', 'max:500', 'regex:#^(/[^\s]*|https://[^\s]+)$#'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
            /** Показывать с (необязательно). */
            'starts_at' => ['sometimes', 'nullable', 'date'],
            /** Показывать до (необязательно). */
            'ends_at' => ['sometimes', 'nullable', 'date', 'after:starts_at'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return ['link.regex' => 'Ссылка должна начинаться с / или https://.'];
    }
}
