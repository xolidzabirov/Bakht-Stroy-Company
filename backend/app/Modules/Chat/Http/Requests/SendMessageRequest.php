<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * New chat message: text and / or up to 5 files, optionally a quote, a product card or an order link.
 * Sent as multipart/form-data when there are files.
 */
final class SendMessageRequest extends FormRequest
{
    public const MAX_FILES = 5;

    /** Kilobytes. */
    public const MAX_FILE_SIZE = 10240;

    public const FILE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /** @example Здравствуйте! Есть цемент М500 в наличии? */
            'body' => ['nullable', 'string', 'max:4000'],
            'attachments' => ['nullable', 'array', 'max:'.self::MAX_FILES],
            /** Фото или документ до 10 МБ: jpg, png, webp, gif, pdf, doc(x), xls(x), txt. */
            'attachments.*' => ['file', 'max:'.self::MAX_FILE_SIZE, 'mimes:'.implode(',', self::FILE_TYPES)],
            /** Ответ на сообщение (цитата). */
            'reply_to_id' => ['nullable', 'integer'],
            /** Карточка товара. */
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            /** Номер своего заказа. @example BS-000025 */
            'order_number' => ['nullable', 'string', 'max:20'],
        ];
    }

    /**
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $empty = blank($this->input('body')) && $this->uploads() === []
                    && blank($this->input('product_id')) && blank($this->input('order_number'));

                if ($empty) {
                    $validator->errors()->add('body', 'Напишите сообщение или прикрепите файл.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['body' => 'сообщение', 'attachments' => 'файлы', 'attachments.*' => 'файл'];
    }

    /**
     * @return list<UploadedFile>
     */
    public function uploads(): array
    {
        $files = $this->file('attachments');

        if ($files instanceof UploadedFile) {
            return [$files];
        }

        return is_array($files) ? array_values($files) : [];
    }

    /**
     * @return array{body: string|null, reply_to_id: int|null, product_id: int|null, order_number: string|null}
     */
    public function payload(): array
    {
        return [
            'body' => $this->filled('body') ? $this->string('body')->toString() : null,
            'reply_to_id' => $this->filled('reply_to_id') ? $this->integer('reply_to_id') : null,
            'product_id' => $this->filled('product_id') ? $this->integer('product_id') : null,
            'order_number' => $this->filled('order_number') ? $this->string('order_number')->upper()->toString() : null,
        ];
    }
}
