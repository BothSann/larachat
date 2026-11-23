<?php

declare(strict_types=1);

use App\Actions\Account\ChangePassword;
use App\Data\ChangePasswordData;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * Sanctum only starts a session for requests from the web app's origin,
 * so every request here pretends to come from http://localhost:3000.
 */
beforeEach(function (): void {
    $this->withHeader('Referer', 'http://localhost:3000');
});

const CHANGE_PASSWORD_URL = '/api/v1/me/password';

/**
 * @return array<string, string>
 */
function changePasswordBody(string $current = 'old-secret-password', string $password = 'new-secret-password'): array
{
    return [
        'current_password' => $current,
        'password' => $password,
        'password_confirmation' => $password,
    ];
}

function annWithOldPassword(): User
{
    return User::factory()->create(['email' => 'ann@example.com', 'password' => 'old-secret-password']);
}

it('changes the password with 204 and an empty body', function (): void {
    $ann = annWithOldPassword();

    $this->actingAs($ann)
        ->putJson(CHANGE_PASSWORD_URL, changePasswordBody())
        ->assertNoContent();

    $ann->refresh();
    expect(Hash::check('new-secret-password', $ann->password))->toBeTrue()
        ->and(Hash::check('old-secret-password', $ann->password))->toBeFalse();
});

it('gives a new remember token', function (): void {
    $ann = annWithOldPassword();
    $oldRememberToken = $ann->remember_token;

    $this->actingAs($ann)->putJson(CHANGE_PASSWORD_URL, changePasswordBody())->assertNoContent();

    expect($ann->refresh()->remember_token)->not->toBe($oldRememberToken)->toHaveLength(60);
});

it('keeps the session that made the change', function (): void {
    annWithOldPassword();
    $this->postJson('/api/v1/auth/login', ['email' => 'ann@example.com', 'password' => 'old-secret-password'])->assertOk();
    $this->app['auth']->forgetGuards();

    $this->putJson(CHANGE_PASSWORD_URL, changePasswordBody())->assertNoContent();
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me')->assertOk();
});

it('ends a session that was open before the change', function (): void {
    $ann = annWithOldPassword();
    $this->postJson('/api/v1/auth/login', ['email' => 'ann@example.com', 'password' => 'old-secret-password'])->assertOk();
    $this->app['auth']->forgetGuards();
    $this->getJson('/api/v1/me')->assertOk();

    // The change happens in another browser, so run the action directly.
    app(ChangePassword::class)->handle($ann, new ChangePasswordData(password: 'new-secret-password'));
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me')->assertUnauthorized();
});

it('lets the user log in with the new password', function (): void {
    $ann = annWithOldPassword();

    $this->actingAs($ann)->putJson(CHANGE_PASSWORD_URL, changePasswordBody())->assertNoContent();

    expect(Auth::guard('web')->validate(['email' => 'ann@example.com', 'password' => 'new-secret-password']))->toBeTrue()
        ->and(Auth::guard('web')->validate(['email' => 'ann@example.com', 'password' => 'old-secret-password']))->toBeFalse();
});

it('refuses a wrong current password and keeps the old one', function (): void {
    $ann = annWithOldPassword();

    $this->actingAs($ann)
        ->putJson(CHANGE_PASSWORD_URL, changePasswordBody(current: 'wrong-password'))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['current_password' => 'The password is incorrect.']);

    expect(Hash::check('old-secret-password', $ann->refresh()->password))->toBeTrue();
});

it('rejects missing fields with 422', function (): void {
    $this->actingAs(annWithOldPassword())
        ->putJson(CHANGE_PASSWORD_URL, [])
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['current_password', 'password']);
});

it('rejects a new password that is the same as the current one', function (): void {
    $this->actingAs(annWithOldPassword())
        ->putJson(CHANGE_PASSWORD_URL, changePasswordBody(password: 'old-secret-password'))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['password']);
});

it('rejects a weak new password', function (): void {
    $this->actingAs(annWithOldPassword())
        ->putJson(CHANGE_PASSWORD_URL, changePasswordBody(password: 'short'))
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['password']);
});

it('rejects a new password that does not match its confirmation', function (): void {
    $this->actingAs(annWithOldPassword())
        ->putJson(CHANGE_PASSWORD_URL, [...changePasswordBody(), 'password_confirmation' => 'something-else-entirely'])
        ->assertUnprocessable()
        ->assertOnlyJsonValidationErrors(['password']);
});

it('refuses a guest with 401', function (): void {
    $this->putJson(CHANGE_PASSWORD_URL, changePasswordBody())->assertUnauthorized();
});

it('allows 5 tries a minute per user, then answers 429', function (): void {
    $ann = annWithOldPassword();
    $bob = User::factory()->create(['password' => 'old-secret-password']);

    foreach (range(1, 5) as $try) {
        $this->actingAs($ann)
            ->putJson(CHANGE_PASSWORD_URL, changePasswordBody(current: 'wrong-password'))
            ->assertUnprocessable();
    }

    $this->actingAs($ann)->putJson(CHANGE_PASSWORD_URL, changePasswordBody())->assertTooManyRequests();
    $this->actingAs($bob)->putJson(CHANGE_PASSWORD_URL, changePasswordBody())->assertNoContent();
});

it('lets an unverified user change their password and keeps them unverified', function (): void {
    $ann = User::factory()->unverified()->create(['password' => 'old-secret-password']);

    $this->actingAs($ann)->putJson(CHANGE_PASSWORD_URL, changePasswordBody())->assertNoContent();

    expect($ann->refresh()->email_verified_at)->toBeNull();
});
