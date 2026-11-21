<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\VerifyEmail;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\QueryParam;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;
use Knuckles\Scribe\Attributes\Unauthenticated;
use Knuckles\Scribe\Attributes\UrlParam;

#[Group('Auth')]
final class VerifyEmailController extends Controller
{
    #[Endpoint('Verify email', 'The link from the verification email. Opened in a browser, so it redirects to the web app instead of returning JSON. Works logged out: the signature proves the link came from us.')]
    #[Unauthenticated]
    #[UrlParam('id', 'string', 'The user ID (ULID).', example: '01JD3F7K2Q8M4N5P6R7S8T9V0W')]
    #[UrlParam('hash', 'string', 'sha1 of the user\'s email.', example: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3')]
    #[QueryParam('expires', 'integer', 'Unix time the link stops working (60 minutes after sending).', example: 1767225600)]
    #[QueryParam('signature', 'string', 'HMAC of the URL, made by the API.', example: 'b1946ac92492d2347c6235b4d2611184')]
    #[ExampleResponse(null, 302, 'Verified (or already verified). Location: FRONTEND_URL/?verified=1')]
    #[ExampleResponse(['message' => 'Invalid signature.'], 403, 'Signature changed, missing, or expired; or hash is not this email')]
    #[ExampleResponse(['message' => 'No query results for model [App\\Models\\User].'], 404, 'Unknown user')]
    #[ExampleResponse(['message' => 'Too Many Attempts.'], 429, 'More than 6 tries in a minute')]
    public function __invoke(string $id, string $hash, VerifyEmail $verifyEmail): RedirectResponse
    {
        $user = User::findOrFail($id);

        $verifyEmail->handle($user, $hash);

        return redirect()->away(config()->string('app.frontend_url').'/?verified=1');
    }
}
