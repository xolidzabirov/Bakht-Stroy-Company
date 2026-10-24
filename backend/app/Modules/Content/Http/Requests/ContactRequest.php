<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Requests;

use App\Shared\Rules\ValidPhone;
use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class ContactRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->attributes->set('raw_phone', $this->input('phone'));

        if (is_string($this->input('phone'))) {
            $this->merge(['phone' => Phone::normalize($this->input('phone'))]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /** @example Сардор */
            'name' => ['required', 'string', 'min:2', 'max:100'],
            /** @example +998901234567 */
            'phone' => ['required', 'string', new ValidPhone($this->attributes->get('raw_phone'))],
            'email' => ['nullable', 'email', 'max:255'],
            /** @example Сколько будет стоить доставка 5 тонн щебня в Чирчик? */
            'message' => ['required', 'string', 'min:5', 'max:3000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['message' => 'сообщение'];
    }
}
