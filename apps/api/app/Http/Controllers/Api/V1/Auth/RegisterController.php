<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\RegisterUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\ResponseFromApiResource;
use Knuckles\Scribe\Attributes\Unauthenticated;

#[Group('Auth', 'Sign up, log in, log out. Call GET /sanctum/csrf-cookie before the first write.')]
final class RegisterController extends Controller
{
    /**
     * Handle the incoming request.
     */
    #[Endpoint('Register', 'Create an account, log it in, and send a verification email.')]
    #[Unauthenticated]
    #[BodyParam('password_confirmation', 'string', 'Must match password.', example: 'correct-horse-battery')]
    #[ResponseFromApiResource(UserResource::class, User::class, 201, 'Account created and logged in')]
    #[ExampleResponse(['message' => 'The username has already been taken.', 'errors' => ['username' => ['The username has already been taken.']]], 422, 'Validation failed')]
    #[ExampleResponse(['message' => 'This action is unauthorized.'], 403, 'Already logged in')]
    public function __invoke(RegisterRequest $request, RegisterUser $registerUser): JsonResponse
    {
        $user = $registerUser->handle($request->toDto());

        Auth::login($user);
        $request->session()->regenerate();

        return UserResource::make($user)->response()->setStatusCode(201);
    }
}
