<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;

/**
 * The link Laravel's VerifyEmail notification puts in the email.
 *
 * @param  array<string, string>  $overrides
 */
function verificationUrl(User $user, array $overrides = [], int $minutes = 60): string
{
    return URL::temporarySignedRoute('verification.verify', now()->addMinutes($minutes), array_merge([
        'id' => $user->getKey(),
        'hash' => sha1($user->getEmailForVerification()),
    ], $overrides));
}

it('sends one verification email when someone registers', function (): void {
    Notification::fake();

    $this->withHeader('Referer', 'http://localhost:3000')
        ->postJson('/api/v1/auth/register', [
            'name' => 'Sok Dara',
            'username' => 'dara_01',
            'email' => 'dara@example.com',
            'password' => 'secret-pass-123',
            'password_confirmation' => 'secret-pass-123',
        ])
        ->assertCreated();

    Notification::assertSentToTimes(User::sole(), VerifyEmail::class, 1);
});

it('puts a link in that email that verifies it', function (): void {
    Notification::fake();
    $user = User::factory()->unverified()->create();

    $user->sendEmailVerificationNotification();

    $url = null;
    Notification::assertSentTo($user, function (VerifyEmail $notification) use ($user, &$url): bool {
        $url = $notification->toMail($user)->actionUrl;

        return true;
    });

    $this->get($url)->assertRedirect('http://localhost:3000/chats?verified=1');

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('verifies the email and redirects to the web app', function (): void {
    Event::fake([Verified::class]);
    $user = User::factory()->unverified()->create();

    $this->get(verificationUrl($user))
        ->assertRedirect('http://localhost:3000/chats?verified=1');

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    Event::assertDispatchedTimes(Verified::class, 1);
});

it('redirects the same way when already verified, without touching the timestamp', function (): void {
    Event::fake([Verified::class]);
    $user = User::factory()->unverified()->create();
    $url = verificationUrl($user);

    $this->get($url)->assertRedirect('http://localhost:3000/chats?verified=1');
    $verifiedAt = $user->fresh()->email_verified_at;

    $this->travel(5)->minutes();

    $this->get($url)->assertRedirect('http://localhost:3000/chats?verified=1');

    expect($user->fresh()->email_verified_at->equalTo($verifiedAt))->toBeTrue();
    Event::assertDispatchedTimes(Verified::class, 1);
});

it('works with no session and no web app headers', function (): void {
    $user = User::factory()->unverified()->create();

    $this->get(verificationUrl($user))->assertRedirect();

    $this->assertGuest();
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('refuses a tampered signature with 403', function (): void {
    $user = User::factory()->unverified()->create();

    $this->getJson(verificationUrl($user).'x')
        ->assertForbidden()
        ->assertJsonPath('message', 'Invalid signature.');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('refuses a link with no signature with 403', function (): void {
    $user = User::factory()->unverified()->create();

    $this->getJson("/api/v1/auth/email/verify/{$user->id}/".sha1($user->email))
        ->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('refuses a link older than 60 minutes with 403', function (): void {
    $user = User::factory()->unverified()->create();
    $url = verificationUrl($user);

    $this->travel(61)->minutes();

    $this->getJson($url)
        ->assertForbidden()
        ->assertJsonPath('message', 'Invalid signature.');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('refuses a signed link whose hash is not this email with 403', function (): void {
    $user = User::factory()->unverified()->create();

    $this->getJson(verificationUrl($user, ['hash' => sha1('someone@else.com')]))
        ->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('answers 404 for a signed link to an unknown user', function (): void {
    $user = User::factory()->unverified()->make(['id' => (string) str()->ulid()]);

    $this->getJson(verificationUrl($user))->assertNotFound();
});

it('answers 429 on the 7th try in a minute', function (): void {
    $user = User::factory()->unverified()->create();
    $url = verificationUrl($user);

    foreach (range(1, 6) as $try) {
        $this->get($url)->assertRedirect();
    }

    $this->getJson($url)->assertTooManyRequests();
});
