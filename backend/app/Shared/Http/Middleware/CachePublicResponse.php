<?php

declare(strict_types=1);

namespace App\Shared\Http\Middleware;

use App\Shared\Support\PublicCache;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps public answers of the catalog, banners and news: the database is asked once, and again only after a change.
 *
 * What is not kept: requests with a token (the answer can differ per person, e.g. is_favorite) and
 * queries with values nobody can count, such as a search or a price range: those would only fill the store.
 */
final class CachePublicResponse
{
    private const PARAMETERS = ['category', 'sort', 'page', 'per_page', 'featured', 'in_stock', 'placement', 'type'];

    private const LAST_PAGE = 5;

    public function handle(Request $request, Closure $next): Response
    {
        $seconds = (int) config('shop.public_cache_ttl');

        if ($seconds <= 0 || ! $this->isKept($request)) {
            return $next($request);
        }

        $key = PublicCache::key($request);
        $kept = Cache::get($key);

        if (is_array($kept)) {
            return new Response($kept['body'], Response::HTTP_OK, ['Content-Type' => $kept['type'], 'X-Public-Cache' => 'hit']);
        }

        $response = $next($request);

        if ($response->getStatusCode() === Response::HTTP_OK) {
            // The same readable JSON as Http\Middleware\JsonApi makes on the way out.
            if ($response instanceof JsonResponse) {
                $response->setEncodingOptions($response->getEncodingOptions() | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            Cache::put($key, ['body' => (string) $response->getContent(), 'type' => (string) $response->headers->get('Content-Type')], $seconds);
        }

        return $response;
    }

    private function isKept(Request $request): bool
    {
        return $request->isMethod('GET')
            && $request->bearerToken() === null
            && array_diff(array_keys($request->query()), self::PARAMETERS) === []
            && $request->integer('page', 1) <= self::LAST_PAGE;
    }
}
