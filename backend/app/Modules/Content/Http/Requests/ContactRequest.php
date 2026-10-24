<?php

declare(strict_types=1);

namespace App\Modules\Content\Http\Requests;

use App\Shared\Support\Phone;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class ContactRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
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
            'phone' => ['required', 'string', 'regex:'.Phone::REGEX],
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
        return ['phone.regex' => 'Введите номер телефона в международном формате, например +998901234567.'];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['message' => 'сообщение'];
    }
}
