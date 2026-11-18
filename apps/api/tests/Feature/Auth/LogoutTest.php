<?php

declare(strict_types=1);

use App\Models\User;

/**
 * Sanctum only starts a session for requests from the web app's origin,
 * so every request here pretends to come from http://localhost:3000.
 */
beforeEach(function (): void {
    $this->withHeader('Referer', 'http://localhost:3000');

    $this->user = User::factory()->create([
        'email' => 'dara@example.com',
        'password' => 'secret-pass-123',
    ]);
});

/** Log in through the real endpoint, so the session is real too. */
function logInForReal(): void
{
    test()->postJson('/api/v1/auth/login', [
        'email' => 'dara@example.com',
        'password' => 'secret-pass-123',
    ])->assertOk();
}

it('logs out with 204 and an empty body', function (): void {
    logInForReal();

    $this->postJson('/api/v1/auth/logout')
        ->assertNoContent();

    $this->assertGuest('web');
});

it('ends the session so the next request is logged out', function (): void {
    logInForReal();
    $this->postJson('/api/v1/auth/logout')->assertNoContent();

    // Forget the user cached in memory, so the next request must look in the session.
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me')->assertUnauthorized();
});

it('wipes the session data and gives a new CSRF token', function (): void {
    logInForReal();
    session()->put('draft', 'half-typed message');
    $oldToken = session()->token();

    $this->postJson('/api/v1/auth/logout')->assertNoContent();

    // invalidate() empties the session; regenerateToken() makes a fresh token.
    expect(session()->has('draft'))->toBeFalse()
        ->and(session()->token())->toBeString()
        ->and(session()->token())->not->toBe($oldToken);
});

it('refuses a logged-out caller with 401', function (): void {
    $this->postJson('/api/v1/auth/logout')
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});
