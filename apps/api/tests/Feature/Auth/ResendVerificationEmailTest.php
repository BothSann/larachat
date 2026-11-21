<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;

/**
 * Sanctum only starts a session for requests from the web app's origin,
 * so every request here pretends to come from http://localhost:3000.
 */
beforeEach(function (): void {
    Notification::fake();
    $this->withHeader('Referer', 'http://localhost:3000');
});

const RESEND_URL = '/api/v1/auth/email/verification-notification';

it('sends the verification email again with 202 and an empty body', function (): void {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->postJson(RESEND_URL)
        ->assertAccepted()
        ->assertNoContent(202);

    Notification::assertSentToTimes($user, VerifyEmail::class, 1);
});

it('puts a working link in the resent email', function (): void {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)->postJson(RESEND_URL)->assertAccepted();

    $url = null;
    Notification::assertSentTo($user, function (VerifyEmail $notification) use ($user, &$url): bool {
        $url = $notification->toMail($user)->actionUrl;

        return true;
    });

    $this->get($url)->assertRedirect('http://localhost:3000/?verified=1');

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('refuses an already verified user with 409 already_verified and sends nothing', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(RESEND_URL)
        ->assertConflict()
        ->assertExactJson([
            'message' => 'Your email is already verified.',
            'code' => 'already_verified',
        ]);

    Notification::assertNothingSent();
});

it('refuses a guest with 401 and sends nothing', function (): void {
    $this->postJson(RESEND_URL)
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);

    Notification::assertNothingSent();
});

it('answers 429 on the 7th try in a minute', function (): void {
    $user = User::factory()->unverified()->create();

    foreach (range(1, 6) as $try) {
        $this->actingAs($user)->postJson(RESEND_URL)->assertAccepted();
    }

    $this->actingAs($user)
        ->postJson(RESEND_URL)
        ->assertTooManyRequests();

    Notification::assertSentToTimes($user, VerifyEmail::class, 6);
});

it('counts the limit per user, not shared', function (): void {
    $dara = User::factory()->unverified()->create();
    $vanna = User::factory()->unverified()->create();

    foreach (range(1, 6) as $try) {
        $this->actingAs($dara)->postJson(RESEND_URL)->assertAccepted();
    }
    $this->actingAs($dara)->postJson(RESEND_URL)->assertTooManyRequests();

    $this->actingAs($vanna)->postJson(RESEND_URL)->assertAccepted();
});
