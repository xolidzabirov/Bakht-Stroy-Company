<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class GoogleUrlRequest extends FormRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            /**
             * Адрес возврата. Google принимает только адреса, записанные в настройках проекта.
             *
             * @example https://bakht-stroy-company.vercel.app/api/auth/google/callback
             */
            'redirect_uri' => ['required', 'url', 'max:300'],
            /** Случайная строка: сайт сверяет её при возврате. */
            'state' => ['required', 'string', 'max:200'],
        ];
    }
}
