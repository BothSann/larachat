<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

/**
 * Sanctum only starts a session for requests from the web app's origin,
 * so every request here pretends to come from http://localhost:3000.
 */
beforeEach(function (): void {
    $this->withHeader('Referer', 'http://localhost:3000');
});

function validRegistration(array $overrides = []): array
{
    return array_merge([
        'name' => 'Sok Dara',
        'username' => 'Dara_01',
        'email' => 'Dara@Example.com',
        'password' => 'secret-pass-123',
        'password_confirmation' => 'secret-pass-123',
    ], $overrides);
}

it('registers a user and returns 201 with the user resource', function (): void {
    $this->postJson('/api/v1/auth/register', validRegistration())
        ->assertCreated()
        ->assertJsonPath('data.name', 'Sok Dara')
        ->assertJsonPath('data.username', 'dara_01')
        ->assertJsonPath('data.email', 'dara@example.com')
        ->assertJsonPath('data.email_verified_at', null)
        ->assertJsonStructure(['data' => ['id', 'name', 'username', 'email', 'email_verified_at', 'created_at']])
        ->assertJsonMissingPath('data.password')
        ->assertJsonMissingPath('data.remember_token');
});

it('stores username and email in lowercase and hashes the password', function (): void {
    $this->postJson('/api/v1/auth/register', validRegistration())->assertCreated();

    $user = User::sole();

    expect($user->username)->toBe('dara_01')
        ->and($user->email)->toBe('dara@example.com')
        ->and($user->password)->not->toBe('secret-pass-123')
        ->and(Hash::check('secret-pass-123', $user->password))->toBeTrue();
});

it('logs the new user in', function (): void {
    $this->postJson('/api/v1/auth/register', validRegistration())->assertCreated();

    $this->assertAuthenticatedAs(User::sole());

    // Forget the user cached in memory, so the next request must find them through the session.
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.username', 'dara_01');
});

it('fires the Registered event once', function (): void {
    Event::fake([Registered::class]);

    $this->postJson('/api/v1/auth/register', validRegistration())->assertCreated();

    Event::assertDispatchedTimes(Registered::class, 1);
});

it('rejects a username that is taken in any letter case', function (): void {
    User::factory()->create(['username' => 'dara_01']);

    $this->postJson('/api/v1/auth/register', validRegistration(['username' => 'DARA_01']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

it('rejects an email that is taken in any letter case', function (): void {
    User::factory()->create(['email' => 'dara@example.com']);

    $this->postJson('/api/v1/auth/register', validRegistration(['email' => 'DARA@EXAMPLE.COM']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('rejects bad input', function (array $overrides, string $field): void {
    $this->postJson('/api/v1/auth/register', validRegistration($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);

    expect(User::count())->toBe(0);
})->with([
    'missing name' => [['name' => ''], 'name'],
    'username with spaces' => [['username' => 'bad name!'], 'username'],
    'username too short' => [['username' => 'ab'], 'username'],
    'username too long' => [['username' => str_repeat('a', 31)], 'username'],
    'bad email' => [['email' => 'not-an-email'], 'email'],
    'short password' => [['password' => 'short', 'password_confirmation' => 'short'], 'password'],
    'password not confirmed' => [['password_confirmation' => 'different-pass'], 'password'],
]);

it('refuses a caller who is already logged in', function (): void {
    $this->actingAs(User::factory()->create());

    $this->postJson('/api/v1/auth/register', validRegistration())
        ->assertForbidden();

    expect(User::count())->toBe(1);
});
