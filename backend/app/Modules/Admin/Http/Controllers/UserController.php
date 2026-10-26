<?php

declare(strict_types=1);

namespace App\Modules\Admin\Http\Controllers;

use App\Modules\Account\Http\Resources\AddressResource;
use App\Modules\Admin\Actions\ManageUsers;
use App\Modules\Admin\Exceptions\CannotManageUserException;
use App\Modules\Admin\Http\Requests\AdminUserIndexRequest;
use App\Modules\Admin\Http\Resources\AdminUserResource;
use App\Modules\Order\Enums\OrderStatus;
use App\Modules\Order\Http\Resources\OrderListResource;
use App\Modules\Order\Models\Order;
use App\Modules\User\Enums\Role;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

#[Group('Админ: пользователи', weight: 14)]
final class UserController extends Controller
{
    public function __construct(private ManageUsers $users) {}

    /**
     * Зарегистрированные пользователи
     *
     * С количеством и суммой заказов. Фильтры: роль, заблокированные, поиск по имени / email / телефону.
     * В meta.total — сколько найдено.
     */
    public function index(AdminUserIndexRequest $request): AnonymousResourceCollection
    {
        $search = trim($request->string('search')->toString());

        $query = $this->withOrderTotals(User::query()->with('roles'))
            ->when($request->filled('role'), fn (Builder $q) => $q->role($request->string('role')->toString()))
            ->when($request->filled('blocked'), fn (Builder $q) => $request->boolean('blocked') ? $q->whereNotNull('blocked_at') : $q->whereNull('blocked_at'))
            ->when($search !== '', function (Builder $q) use ($search) {
                $like = '%'.addcslashes(mb_strtolower($search), '%_\\').'%';
                $digits = (string) preg_replace('/\D+/', '', $search);

                $q->where(fn (Builder $w) => $w->whereRaw('lower(users.name) like ?', [$like])
                    ->orWhereRaw('lower(users.email) like ?', [$like])
                    ->when(strlen($digits) >= 4, fn (Builder $p) => $p->orWhere('users.phone', 'like', '%'.$digits.'%')));
            });

        match ($request->input('sort')) {
            'name' => $query->orderBy('users.name'),
            'orders' => $query->orderByDesc('orders_total')->orderByDesc('users.id'),
            default => $query->latest('users.id'),
        };

        return AdminUserResource::collection($query->paginate($request->integer('per_page', 20))->withQueryString());
    }

    /**
     * Пользователь
     *
     * Профиль, итоги заказов, адреса и последние 10 заказов.
     */
    public function show(int $user): JsonResponse
    {
        $model = $this->withOrderTotals(User::query()->with('roles'))->findOrFail($user);

        return response()->json(['data' => [
            ...AdminUserResource::make($model)->resolve(),
            'addresses' => AddressResource::collection(Address::query()->where('user_id', $model->id)->orderByDesc('is_default')->get()),
            'recent_orders' => OrderListResource::collection(
                Order::query()->where('user_id', $model->id)->withCount('items')->latest('id')->limit(10)->get(),
            ),
        ]]);
    }

    /**
     * Заблокировать
     *
     * Только администратор. Пользователь сразу выходит со всех устройств и не может войти.
     * Администратора заблокировать нельзя.
     *
     * @throws CannotManageUserException
     */
    public function block(#[CurrentUser] User $admin, int $user): AdminUserResource
    {
        return AdminUserResource::make($this->users->block($this->find($user), $admin)->load('roles'));
    }

    /**
     * Разблокировать
     *
     * @throws CannotManageUserException
     */
    public function unblock(#[CurrentUser] User $admin, int $user): AdminUserResource
    {
        return AdminUserResource::make($this->users->unblock($this->find($user), $admin)->load('roles'));
    }

    /**
     * Изменить роль
     *
     * Только администратор: client — покупатель, manager — менеджер (заказы, товары, новости, баннеры).
     * Пользователь выходит из аккаунта, новые права действуют после входа.
     *
     * @throws CannotManageUserException
     */
    public function changeRole(Request $request, #[CurrentUser] User $admin, int $user): AdminUserResource
    {
        $request->validate(['role' => ['required', Rule::in([Role::Client->value, Role::Manager->value])]]);

        return AdminUserResource::make($this->users->changeRole($this->find($user), Role::from($request->string('role')->toString()), $admin));
    }

    private function find(int $id): User
    {
        return User::query()->findOrFail($id);
    }

    /**
     * Adds orders_count, orders_total (not cancelled) and last_order_at columns.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    private function withOrderTotals(Builder $query): Builder
    {
        $orders = fn (string $select) => Order::query()->toBase()->selectRaw($select)->whereColumn('orders.user_id', 'users.id');

        return $query->select('users.*')
            ->selectSub($orders('count(*)'), 'orders_count')
            ->selectSub($orders('coalesce(sum(total), 0)')->where('status', '!=', OrderStatus::Cancelled->value), 'orders_total')
            ->selectSub($orders('max(created_at)'), 'last_order_at');
    }
}
