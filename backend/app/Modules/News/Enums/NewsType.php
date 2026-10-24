<?php

declare(strict_types=1);

namespace App\Modules\News\Enums;

enum NewsType: string
{
    case News = 'news';
    case Promo = 'promo';
    case Article = 'article';

    public function label(): string
    {
        return match ($this) {
            self::News => 'Новости компании',
            self::Promo => 'Акции',
            self::Article => 'Статьи и советы',
        };
    }
}
