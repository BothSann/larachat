<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\ResetPassword;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\Response;
use Knuckles\Scribe\Attributes\BodyParam;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\Unauthenticated;

#[Group('Auth')]
final class ResetPasswordController extends Controller
{
    #[Endpoint('Reset password', 'Set a new password with the token and email from the reset link. Ends every session and does not log in. Shares the forgot-password limit: 5 tries a minute per IP.')]
    #[Unauthenticated]
    #[BodyParam('password_confirmation', 'string', 'Must match password.', example: 'correct-horse-battery')]
    #[ExampleResponse(null, 204, 'Password changed')]
    #[ExampleResponse(['message' => 'This action is unauthorized.'], 403, 'Already logged in')]
    #[ExampleResponse(['message' => 'This reset link is invalid or has expired.', 'errors' => ['token' => ['This reset link is invalid or has expired.']]], 422, 'Bad reset link, or a missing or bad field')]
    #[ExampleResponse(['message' => 'Too Many Attempts.'], 429, 'More than 5 tries in a minute')]
    public function __invoke(ResetPasswordRequest $request, ResetPassword $resetPassword): Response
    {
        $resetPassword->handle($request->toDto());

        return response()->noContent();
    }
}
