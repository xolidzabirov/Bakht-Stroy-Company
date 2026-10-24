<?php

declare(strict_types=1);

namespace App\Modules\Order\Http\Controllers;

use App\Modules\Cart\Http\Resources\CartResource;
use App\Modules\Cart\Queries\CartQuery;
use App\Modules\Order\Actions\CancelOrderByClient;
use App\Modules\Order\Actions\PlaceOrder;
use App\Modules\Order\Actions\RepeatOrder;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Exceptions\CartEmptyException;
use App\Modules\Order\Exceptions\CartHasProblemsException;
use App\Modules\Order\Exceptions\OrderCannotBeCancelledException;
use App\Modules\Order\Http\Requests\CancelOrderRequest;
use App\Modules\Order\Http\Requests\OrderIndexRequest;
use App\Modules\Order\Http\Requests\PlaceOrderRequest;
use App\Modules\Order\Http\Resources\OrderListResource;
use App\Modules\Order\Http\Resources\OrderResource;
use App\Modules\Order\Models\Order;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Заказы', weight: 5)]
final class OrderController extends Controller
{
    /**
     * Мои заказы
     *
     * Новые сверху. Фильтр status: new, confirmed, assembling, delivering, completed, cancelled или active.
     */
    public function index(OrderIndexRequest $request, #[CurrentUser] User $user): AnonymousResourceCollection
    {
        $status = $request->string('status')->toString();

        $orders = Order::query()
            ->where('user_id', $user->id)
            ->withCount('items')
            ->when($status === 'active', fn (Builder $q) => $q->whereNotIn('status', [OrderStatus::Completed, OrderStatus::Cancelled]))
            ->when($status !== '' && $status !== 'active', fn (Builder $q) => $q->where('status', $status))
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return OrderListResource::collection($orders);
    }

    /**
     * Оформить заказ
     *
     * Создаёт заказ из всей корзины: проверяет наличие (409 CART_HAS_PROBLEMS — в details список
     * проблемных позиций), фиксирует цены, списывает остатки и очищает корзину.
     * Доставка бесплатна при самовывозе и для заказов от DELIVERY_FREE_FROM сум.
     *
     * @throws CartEmptyException
     * @throws CartHasProblemsException
     */
    public function store(PlaceOrderRequest $request, #[CurrentUser] User $user, PlaceOrder $placeOrder): JsonResponse
    {
        $order = $placeOrder->handle($user, $request->toData($user));

        return OrderResource::make($order->load(['items.product.media', 'history']))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Заказ
     *
     * По номеру, например BS-000123. Чужой заказ — 404.
     */
    public function show(#[CurrentUser] User $user, string $number): OrderResource
    {
        return OrderResource::make($this->findOrder($user, $number)->load(['items.product.media', 'history']));
    }

    /**
     * Отменить заказ
     *
     * Только пока заказ в статусе «Новый». Товары возвращаются на склад.
     *
     * @throws OrderCannotBeCancelledException
     */
    public function cancel(CancelOrderRequest $request, #[CurrentUser] User $user, string $number, CancelOrderByClient $cancel): OrderResource
    {
        $order = $cancel->handle($this->findOrder($user, $number), $user, $request->input('reason'));

        return OrderResource::make($order->load(['items.product.media', 'history']));
    }

    /**
     * Повторить заказ
     *
     * Кладёт товары заказа в корзину (сколько есть на складе). В skipped — что не удалось добавить
     * полностью: unavailable, out_of_stock, partially_added.
     */
    public function repeat(#[CurrentUser] User $user, string $number, RepeatOrder $repeatOrder, CartQuery $cart): JsonResponse
    {
        $skipped = $repeatOrder->handle($this->findOrder($user, $number)->load('items'), $user);

        return response()->json([
            'data' => [
                'cart' => CartResource::make($cart->items($user)),
                /** @var list<array{product_name: string, reason: string}> */
                'skipped' => $skipped,
            ],
        ]);
    }

    private function findOrder(User $user, string $number): Order
    {
        $order = Order::query()->where('user_id', $user->id)->where('number', mb_strtoupper($number))->first();

        if ($order === null) {
            throw new NotFoundHttpException;
        }

        return $order;
    }
}
