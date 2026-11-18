<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\LoginUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;

final class LoginController extends Controller
{
    public function __invoke(LoginRequest $request, LoginUser $loginUser): UserResource
    {
        $user = $loginUser->handle($request->toDto());

        $request->session()->regenerate();

        return UserResource::make($user);
    }
}
