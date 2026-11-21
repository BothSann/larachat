<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\ResendVerificationEmail;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;
use Knuckles\Scribe\Attributes\Authenticated;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;

#[Group('Auth')]
final class ResendVerificationEmailController extends Controller
{
    #[Endpoint('Resend verification email', 'Send the verification email again, with a fresh 60-minute link.')]
    #[Authenticated]
    #[ExampleResponse(null, 202, 'Email sent')]
    #[ExampleResponse(['message' => 'Unauthenticated.'], 401, 'Not logged in')]
    #[ExampleResponse(['message' => 'Your email is already verified.', 'code' => 'already_verified'], 409, 'Already verified; nothing sent')]
    #[ExampleResponse(['message' => 'Too Many Attempts.'], 429, 'More than 6 tries in a minute')]
    public function __invoke(#[CurrentUser] User $user, ResendVerificationEmail $resend): Response
    {
        $resend->handle($user);

        return response()->noContent(202);
    }
}
