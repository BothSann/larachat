<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Account\ChangePassword;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\ChangePasswordRequest;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;
use Knuckles\Scribe\Attributes\Authenticated;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;

#[Group('Account')]
final class ChangePasswordController extends Controller
{
    #[Endpoint('Change password', 'Set a new password by giving the current one. Keeps this session and ends every other one. 5 tries a minute per user.')]
    #[Authenticated]
    #[BodyParam('current_password', 'string', 'Your password now.', example: 'old-secret-password')]
    #[BodyParam('password', 'string', 'The new password. Must differ from current_password.', example: 'correct-horse-battery')]
    #[BodyParam('password_confirmation', 'string', 'Must match password.', example: 'correct-horse-battery')]
    #[ExampleResponse(null, 204, 'Password changed')]
    #[ExampleResponse(['message' => 'Unauthenticated.'], 401, 'Not logged in')]
    #[ExampleResponse(['message' => 'The password is incorrect.', 'errors' => ['current_password' => ['The password is incorrect.']]], 422, 'Wrong current password, or a missing or bad field')]
    #[ExampleResponse(['message' => 'Too Many Attempts.'], 429, 'More than 5 tries in a minute')]
    public function __invoke(#[CurrentUser] User $user, ChangePasswordRequest $request, ChangePassword $changePassword): Response
    {
        $changePassword->handle($user, $request->toDto());

        return response()->noContent();
    }
}
