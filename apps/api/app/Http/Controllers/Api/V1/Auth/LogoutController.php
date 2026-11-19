<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Knuckles\Scribe\Attributes\Authenticated;
use Knuckles\Scribe\Attributes\Endpoint;
use Knuckles\Scribe\Attributes\Group;
use Knuckles\Scribe\Attributes\Response as ExampleResponse;

#[Group('Auth')]
final class LogoutController extends Controller
{
    #[Endpoint('Log out', 'End the session and rotate the CSRF token.')]
    #[Authenticated]
    #[ExampleResponse(null, 204, 'Logged out')]
    #[ExampleResponse(['message' => 'Unauthenticated.'], 401, 'Not logged in')]
    public function __invoke(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
