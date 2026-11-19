<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\LoginUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\ResponseFromApiResource;
use Knuckles\Scribe\Attributes\Unauthenticated;

#[Group('Auth')]
final class LoginController extends Controller
{
    #[Endpoint('Log in', 'Start a session. Limited to 5 tries a minute per email and IP.')]
    #[Unauthenticated]
    #[ResponseFromApiResource(UserResource::class, User::class, 200, 'Logged in')]
    #[ExampleResponse(['message' => 'These credentials do not match our records.', 'errors' => ['email' => ['These credentials do not match our records.']]], 422, 'Wrong email or password')]
    #[ExampleResponse(['message' => 'This action is unauthorized.'], 403, 'Already logged in')]
    #[ExampleResponse(['message' => 'Too Many Attempts.'], 429, 'Too many tries')]
    public function __invoke(LoginRequest $request, LoginUser $loginUser): UserResource
    {
        $user = $loginUser->handle($request->toDto());

        $request->session()->regenerate();

        return UserResource::make($user);
    }
}
