<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\SendPasswordResetLink;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Http\Response;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\Unauthenticated;

#[Group('Auth')]
final class ForgotPasswordController extends Controller
{
    #[Endpoint('Send password reset link', 'Email a 60-minute reset link if the address has an account. The reply is the same either way. Limited to 5 tries a minute per IP.')]
    #[Unauthenticated]
    #[ExampleResponse(null, 202, 'Accepted (sent, or no account with that email)')]
    #[ExampleResponse(['message' => 'This action is unauthorized.'], 403, 'Already logged in')]
    #[ExampleResponse(['message' => 'The email field is required.', 'errors' => ['email' => ['The email field is required.']]], 422, 'Missing or bad email')]
    #[ExampleResponse(['message' => 'Too Many Attempts.'], 429, 'More than 5 tries in a minute')]
    public function __invoke(ForgotPasswordRequest $request, SendPasswordResetLink $sendLink): Response
    {
        $sendLink->handle($request->toDto());

        return response()->noContent(202);
    }
}
