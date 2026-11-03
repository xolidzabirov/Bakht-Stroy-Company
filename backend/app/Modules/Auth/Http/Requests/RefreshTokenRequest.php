<?php

declare(strict_types=1);

namespace App\Modules\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class RefreshTokenRequest extends FormRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            /**
             * Значение refresh_token из ответа входа или предыдущего обновления.
             *
             * @example 1|Qm2kZ0pX9yJcT4wLr7NbE5aU3fGd6iKoY1qWhS8vQm2kZ0pX9yJcT4wLr7NbE5aU
             */
            'refresh_token' => ['required', 'string', 'max:255'],
        ];
    }
}
