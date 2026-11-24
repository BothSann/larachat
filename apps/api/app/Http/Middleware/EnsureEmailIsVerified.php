<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Exceptions\EmailNotVerified;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureEmailIsVerified
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user() ?? throw new AuthenticationException;

        if (! $user->hasVerifiedEmail()) {
            throw new EmailNotVerified;
        }

        return $next($request);
    }
}
