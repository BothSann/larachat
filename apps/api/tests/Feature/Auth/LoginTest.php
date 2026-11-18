<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Sanctum only starts a session for requests from the web app's origin,
 * so every request here pretends to come from http://localhost:3000.
 */
beforeEach(function (): void {
    $this->withHeader('Referer', 'http://localhost:3000');

    $this->user = User::factory()->create([
        'username' => 'dara_01',
        'email' => 'dara@example.com',
        'password' => 'secret-pass-123',
    ]);
});

function loginBody(array $overrides = []): array
{
    return array_merge([
        'email' => 'dara@example.com',
        'password' => 'secret-pass-123',
    ], $overrides);
}

it('logs in with the right details and returns 200 with the user resource', function (): void {
    $this->postJson('/api/v1/auth/login', loginBody())
        ->assertOk()
        ->assertJsonPath('data.id', $this->user->id)
        ->assertJsonPath('data.username', 'dara_01')
        ->assertJsonPath('data.email', 'dara@example.com')
        ->assertExactJsonStructure(['data' => ['id', 'name', 'username', 'email', 'email_verified_at', 'created_at']]);

    $this->assertAuthenticatedAs($this->user);
});

it('keeps the user logged in for the next request', function (): void {
    $this->postJson('/api/v1/auth/login', loginBody())->assertOk();

    // Forget the user cached in memory, so the next request must find them through the session.
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.username', 'dara_01');
});

it('accepts the email in any letter case', function (): void {
    $this->postJson('/api/v1/auth/login', loginBody(['email' => '  Dara@Example.COM ']))
        ->assertOk()
        ->assertJsonPath('data.email', 'dara@example.com');
});

it('sets a remember-me cookie only when remember is true', function (): void {
    $cookie = Auth::guard('web')->getRecallerName();

    $this->postJson('/api/v1/auth/login', loginBody(['remember' => true]))
        ->assertOk()
        ->assertCookie($cookie);

    Auth::guard('web')->logout();
    $this->app['auth']->forgetGuards();

    $this->postJson('/api/v1/auth/login', loginBody())
        ->assertOk()
        ->assertCookieMissing($cookie);
});

it('gives the same 422 for a wrong password and an unknown email', function (): void {
    $wrongPassword = $this->postJson('/api/v1/auth/login', loginBody(['password' => 'wrong-pass-123']));
    $unknownEmail = $this->postJson('/api/v1/auth/login', loginBody(['email' => 'nobody@example.com']));

    $wrongPassword->assertUnprocessable()
        ->assertExactJson([
            'message' => 'These credentials do not match our records.',
            'errors' => ['email' => ['These credentials do not match our records.']],
        ]);

    expect($unknownEmail->status())->toBe(422)
        ->and($unknownEmail->json())->toBe($wrongPassword->json());

    $this->assertGuest();
});

it('rejects missing or badly shaped fields', function (array $body, array $errors): void {
    $this->postJson('/api/v1/auth/login', $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errors);
})->with([
    'empty body' => [[], ['email', 'password']],
    'not an email' => [['email' => 'dara', 'password' => 'secret-pass-123'], ['email']],
    'remember not a boolean' => [['email' => 'dara@example.com', 'password' => 'secret-pass-123', 'remember' => 'yes please'], ['remember']],
]);

it('returns 429 on the 6th try in a minute for the same email and IP', function (): void {
    foreach (range(1, 5) as $try) {
        $this->postJson('/api/v1/auth/login', loginBody(['password' => 'wrong-pass-123']))
            ->assertUnprocessable();
    }

    $this->postJson('/api/v1/auth/login', loginBody())
        ->assertTooManyRequests()
        ->assertHeader('Retry-After')
        ->assertJsonPath('message', 'Too Many Attempts.');

    $this->assertGuest();
});

it('counts the email in any letter case as the same email', function (): void {
    foreach (range(1, 5) as $try) {
        $this->postJson('/api/v1/auth/login', loginBody(['email' => 'DARA@example.com', 'password' => 'wrong-pass-123']));
    }

    $this->postJson('/api/v1/auth/login', loginBody())->assertTooManyRequests();
});

it('limits each email separately, not the whole IP', function (): void {
    foreach (range(1, 5) as $try) {
        $this->postJson('/api/v1/auth/login', loginBody(['password' => 'wrong-pass-123']));
    }

    $this->postJson('/api/v1/auth/login', loginBody(['email' => 'someone@example.com']))
        ->assertUnprocessable();
});

it('refuses a caller who is already logged in with 403', function (): void {
    $other = User::factory()->create();

    $this->actingAs($other)
        ->postJson('/api/v1/auth/login', loginBody())
        ->assertForbidden()
        ->assertJsonPath('message', 'This action is unauthorized.');

    $this->assertAuthenticatedAs($other);
});
