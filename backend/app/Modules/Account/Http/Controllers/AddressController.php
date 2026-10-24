<?php

declare(strict_types=1);

namespace App\Modules\Account\Http\Controllers;

use App\Modules\Account\Actions\ManageAddresses;
use App\Modules\Account\Exceptions\TooManyAddressesException;
use App\Modules\Account\Http\Requests\SaveAddressRequest;
use App\Modules\Account\Http\Resources\AddressResource;
use App\Modules\User\Models\Address;
use App\Modules\User\Models\User;
use App\Shared\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[Group('Личный кабинет', weight: 6)]
final class AddressController extends Controller
{
    public function __construct(private ManageAddresses $addresses) {}

    /**
     * Мои адреса
     *
     * Основной адрес — первым. При оформлении заказа можно передать address_id.
     */
    public function index(#[CurrentUser] User $user): AnonymousResourceCollection
    {
        return AddressResource::collection(
            Address::query()->where('user_id', $user->id)->orderByDesc('is_default')->latest('id')->get(),
        );
    }

    /**
     * Добавить адрес
     *
     * Первый адрес автоматически становится основным. Не больше 10 адресов.
     *
     * @throws TooManyAddressesException
     */
    public function store(SaveAddressRequest $request, #[CurrentUser] User $user): JsonResponse
    {
        /** @var array{city: string, street: string, house: string} $attributes */
        $attributes = $request->attributesToSave();

        return AddressResource::make($this->addresses->create($user, $attributes))->response()->setStatusCode(201);
    }

    /**
     * Изменить адрес
     */
    public function update(SaveAddressRequest $request, #[CurrentUser] User $user, int $address): AddressResource
    {
        return AddressResource::make($this->addresses->update($this->find($user, $address), $request->attributesToSave()));
    }

    /**
     * Сделать адрес основным
     */
    public function makeDefault(#[CurrentUser] User $user, int $address): AddressResource
    {
        return AddressResource::make($this->addresses->setDefault($this->find($user, $address)));
    }

    /**
     * Удалить адрес
     *
     * Если удалён основной, основным становится последний добавленный.
     */
    public function destroy(#[CurrentUser] User $user, int $address): Response
    {
        $this->addresses->delete($this->find($user, $address));

        return response()->noContent();
    }

    private function find(User $user, int $id): Address
    {
        $address = Address::query()->where('user_id', $user->id)->find($id);

        if ($address === null) {
            throw new NotFoundHttpException;
        }

        return $address;
    }
}
