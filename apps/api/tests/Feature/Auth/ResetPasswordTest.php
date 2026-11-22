<?php

declare(strict_types=1);

use App\Actions\Auth\ResetPassword;
use App\Data\ResetPasswordData;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

/**
 * Sanctum only starts a session for requests from the web app's origin,
 * so every request here pretends to come from http://localhost:3000.
 */
beforeEach(function (): void {
    $this->withHeader('Referer', 'http://localhost:3000');
});

const RESET_URL = '/api/v1/auth/reset-password';
const BAD_LINK = 'This reset link is invalid or has expired.';

/**
 * @return array<string, string>
 */
function resetBody(string $token, string $email = 'ann@example.com', string $password = 'new-secret-password'): array
{
    return [
        'token' => $token,
        'email' => $email,
        'password' => $password,
        'password_confirmation' => $password,
    ];
}

it('sets the new password with 204 and an empty body', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com', 'password' => 'old-secret-password']);
    $token = Password::createToken($ann);

    $this->postJson(RESET_URL, resetBody($token, ' Ann@Example.com '))
        ->assertNoContent();

    $ann->refresh();
    expect(Hash::check('new-secret-password', $ann->password))->toBeTrue()
        ->and(Hash::check('old-secret-password', $ann->password))->toBeFalse();
    $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'ann@example.com']);
});

it('gives a new remember token and fires PasswordReset', function (): void {
    Event::fake([PasswordReset::class]);
    $ann = User::factory()->create(['email' => 'ann@example.com']);
    $oldRememberToken = $ann->remember_token;

    $this->postJson(RESET_URL, resetBody(Password::createToken($ann)))->assertNoContent();

    expect($ann->refresh()->remember_token)->not->toBe($oldRememberToken)->toHaveLength(60);
    Event::assertDispatchedTimes(PasswordReset::class, 1);
    Event::assertDispatched(PasswordReset::class, fn (PasswordReset $event): bool => $event->user->is($ann));
});

it('does not log the user in', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson(RESET_URL, resetBody(Password::createToken($ann)))->assertNoContent();

    $this->assertGuest();
});

it('ends a session that was open before the reset', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com', 'password' => 'old-secret-password']);
    $this->postJson('/api/v1/auth/login', ['email' => 'ann@example.com', 'password' => 'old-secret-password'])->assertOk();
    $this->app['auth']->forgetGuards();
    $this->getJson('/api/v1/me')->assertOk();

    // The reset happens in another browser, so run the action directly.
    app(ResetPassword::class)->handle(new ResetPasswordData(
        token: Password::createToken($ann),
        email: 'ann@example.com',
        password: 'new-secret-password',
    ));
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me')->assertUnauthorized();
});

it('lets the user log in with the new password', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com', 'password' => 'old-secret-password']);

    $this->postJson(RESET_URL, resetBody(Password::createToken($ann)))->assertNoContent();

    $this->postJson('/api/v1/auth/login', ['email' => 'ann@example.com', 'password' => 'new-secret-password'])
        ->assertOk();
});

it('refuses the same link twice', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com']);
    $token = Password::createToken($ann);

    $this->postJson(RESET_URL, resetBody($token))->assertNoContent();

    $this->postJson(RESET_URL, resetBody($token, password: 'another-secret-password'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['token' => BAD_LINK]);
});

it('refuses a wrong token and keeps the old password', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com', 'password' => 'old-secret-password']);
    Password::createToken($ann);

    $this->postJson(RESET_URL, resetBody('wrong-token'))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['token' => BAD_LINK]);

    expect(Hash::check('old-secret-password', $ann->refresh()->password))->toBeTrue();
});

it('refuses a link older than 60 minutes', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com']);
    $token = Password::createToken($ann);

    $this->travel(61)->minutes();

    $this->postJson(RESET_URL, resetBody($token))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['token' => BAD_LINK]);
});

it('gives the same token error for an email with no account', function (): void {
    $this->postJson(RESET_URL, resetBody('any-token', 'nobody@example.com'))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['token' => BAD_LINK]);
});

it('rejects missing fields with 422', function (): void {
    $this->postJson(RESET_URL, [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['token', 'email', 'password']);
});

it('rejects a bad password with 422', function (array $override): void {
    $ann = User::factory()->create(['email' => 'ann@example.com', 'password' => 'old-secret-password']);

    $this->postJson(RESET_URL, [...resetBody(Password::createToken($ann)), ...$override])
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['password']);

    expect(Hash::check('old-secret-password', $ann->refresh()->password))->toBeTrue();
})->with([
    'too short' => [['password' => 'short', 'password_confirmation' => 'short']],
    'not confirmed' => [['password_confirmation' => 'something-else-entirely']],
]);

it('refuses a caller who is already logged in with 403', function (): void {
    $ann = User::factory()->create(['email' => 'ann@example.com', 'password' => 'old-secret-password']);

    $this->actingAs($ann)
        ->postJson(RESET_URL, resetBody(Password::createToken($ann)))
        ->assertForbidden();

    expect(Hash::check('old-secret-password', $ann->refresh()->password))->toBeTrue();
});

it('shares the 5 a minute limit with forgot-password', function (): void {
    foreach (range(1, 3) as $try) {
        $this->postJson('/api/v1/auth/forgot-password', ['email' => "person{$try}@example.com"])->assertAccepted();
    }
    foreach (range(1, 2) as $try) {
        $this->postJson(RESET_URL, resetBody('wrong-token'))->assertUnprocessable();
    }

    $this->postJson(RESET_URL, resetBody('wrong-token'))->assertTooManyRequests();
});

it('lets an unverified user reset, and keeps them unverified', function (): void {
    $ann = User::factory()->unverified()->create(['email' => 'ann@example.com']);

    $this->postJson(RESET_URL, resetBody(Password::createToken($ann)))->assertNoContent();

    expect($ann->refresh()->hasVerifiedEmail())->toBeFalse();
});
