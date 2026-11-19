<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Knuckles\Scribe\Attributes\Authenticated;
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
}
