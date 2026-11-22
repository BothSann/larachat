<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Account\UpdateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdateMeRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Request;
use Knuckles\Scribe\Attributes\Authenticated;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\ResponseFromApiResource;

#[Group('Account', 'The logged-in user.')]
final class MeController extends Controller
{
    #[Endpoint('Current user', 'Who is logged in.')]
    #[Authenticated]
    #[ResponseFromApiResource(UserResource::class, User::class, 200, 'The logged-in user')]
    #[ExampleResponse(['message' => 'Unauthenticated.'], 401, 'Not logged in')]
    public function show(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }

    #[Endpoint('Update current user', 'Change your name and/or username. Send only the fields you want to change.')]
    #[Authenticated]
    #[BodyParam('name', 'string', 'Your name. Max 255.', required: false, example: 'Dara Sok')]
    #[BodyParam('username', 'string', '3 to 30 lowercase letters, numbers, or underscores. Trimmed and lowercased.', required: false, example: 'dara_02')]
    #[ResponseFromApiResource(UserResource::class, User::class, 200, 'The updated user')]
    #[ExampleResponse(['message' => 'The username has already been taken.', 'errors' => ['username' => ['The username has already been taken.']]], 422, 'Validation failed')]
    #[ExampleResponse(['message' => 'Unauthenticated.'], 401, 'Not logged in')]
    public function update(#[CurrentUser] User $user, UpdateMeRequest $request, UpdateProfile $updateProfile): UserResource
    {
        return UserResource::make($updateProfile->handle($user, $request->toDto()));
    }
}
