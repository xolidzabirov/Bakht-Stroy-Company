<?php

declare(strict_types=1);

namespace App\Modules\Cart\Http\Controllers;

use App\Modules\Cart\Actions\ChangeCart;
use App\Modules\Cart\Exceptions\BelowMinOrderException;
use App\Modules\Cart\Exceptions\NotEnoughStockException;
use App\Modules\Cart\Exceptions\ProductUnavailableException;
use App\Modules\Cart\Http\Requests\AddToCartRequest;
use App\Modules\Cart\Http\Requests\UpdateCartItemRequest;
use App\Modules\Cart\Http\Resources\CartResource;
use App\Modules\Cart\Models\CartItem;
use App\Modules\Cart\Queries\CartQuery;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Корзина', weight: 3)]
final class CartController extends Controller
{
    public function __construct(private CartQuery $cart) {}

    /**
     * Моя корзина
     *
     * Позиции с текущими ценами и итог. Если товар закончился или его сняли с продажи,
     * у позиции заполнено поле problem, и оформить заказ нельзя, пока её не исправят.
     */
    public function show(#[CurrentUser] User $user): CartResource
    {
        return CartResource::make($this->cart->items($user));
    }

    /**
     * Добавить в корзину
     *
     * Если товар уже в корзине, количество прибавляется. Учитываются остаток и минимальный заказ.
     *
     * @throws ProductUnavailableException
     * @throws NotEnoughStockException
     * @throws BelowMinOrderException
     */
    public function store(AddToCartRequest $request, #[CurrentUser] User $user, ChangeCart $changeCart): CartResource
    {
        $changeCart->add($user, $request->integer('product_id'), $request->integer('quantity', 1));

        return CartResource::make($this->cart->items($user));
    }

    /**
     * Изменить количество
     *
     * @throws ProductUnavailableException
     * @throws NotEnoughStockException
     * @throws BelowMinOrderException
     */
    public function update(UpdateCartItemRequest $request, #[CurrentUser] User $user, int $item, ChangeCart $changeCart): CartResource
    {
        $changeCart->setQuantity($this->findItem($user, $item), $request->integer('quantity'));

        return CartResource::make($this->cart->items($user));
    }

    /**
     * Удалить позицию
     */
    public function destroy(#[CurrentUser] User $user, int $item, ChangeCart $changeCart): CartResource
    {
        $changeCart->remove($this->findItem($user, $item));

        return CartResource::make($this->cart->items($user));
    }

    /**
     * Очистить корзину
     */
    public function clear(#[CurrentUser] User $user, ChangeCart $changeCart): Response
    {
        $changeCart->clear($user);

        return response()->noContent();
    }

    /**
     * Only the owner's lines; someone else's line is "not found".
     */
    private function findItem(User $user, int $id): CartItem
    {
        $item = CartItem::query()->where('user_id', $user->id)->with('product.category')->find($id);

        if ($item === null) {
            throw new NotFoundHttpException;
        }

        return $item;
    }
}
