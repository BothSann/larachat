<?php

declare(strict_types=1);

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

/**
 * Sanctum only starts a session for requests from the web app's origin,
 * so every request here pretends to come from http://localhost:3000.
 */
beforeEach(function (): void {
    $this->withHeader('Referer', 'http://localhost:3000');
});

const FORGOT_URL = '/api/v1/auth/forgot-password';

it('sends a reset email with 202 and an empty body', function (): void {
    Notification::fake();
    $ann = User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson(FORGOT_URL, ['email' => ' Ann@Example.com '])
        ->assertAccepted()
        ->assertNoContent(202);

    Notification::assertSentToTimes($ann, ResetPasswordNotification::class, 1);
    $this->assertDatabaseHas('password_reset_tokens', ['email' => 'ann@example.com']);
});

it('puts the email on the queue instead of sending it during the request', function (): void {
    Queue::fake();
    User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson(FORGOT_URL, ['email' => 'ann@example.com'])->assertAccepted();

    Queue::assertPushed(
        SendQueuedNotifications::class,
        fn (SendQueuedNotifications $job): bool => $job->notification instanceof ResetPasswordNotification,
    );
});

it('links to the web app reset page, not the API', function (): void {
    Notification::fake();
    $ann = User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson(FORGOT_URL, ['email' => 'ann@example.com'])->assertAccepted();

    Notification::assertSentTo($ann, function (ResetPasswordNotification $notification) use ($ann): bool {
        $url = $notification->toMail($ann)->actionUrl;

        expect($url)->toBe('http://localhost:3000/reset-password?token='.$notification->token.'&email=ann%40example.com');

        return true;
    });
});

it('gives the same 202 for an email with no account and sends nothing', function (): void {
    Notification::fake();

    $this->postJson(FORGOT_URL, ['email' => 'nobody@example.com'])
        ->assertAccepted()
        ->assertNoContent(202);

    Notification::assertNothingSent();
    $this->assertDatabaseCount('password_reset_tokens', 0);
});

it('gives the same 202 inside the broker wait and sends no second email', function (): void {
    Notification::fake();
    $ann = User::factory()->create(['email' => 'ann@example.com']);

    $this->postJson(FORGOT_URL, ['email' => 'ann@example.com'])->assertAccepted();
    $this->postJson(FORGOT_URL, ['email' => 'ann@example.com'])
        ->assertAccepted()
        ->assertNoContent(202);

    Notification::assertSentToTimes($ann, ResetPasswordNotification::class, 1);
});

it('sends the email to an unverified user too', function (): void {
    Notification::fake();
    $ann = User::factory()->unverified()->create(['email' => 'ann@example.com']);

    $this->postJson(FORGOT_URL, ['email' => 'ann@example.com'])->assertAccepted();

    Notification::assertSentTo($ann, ResetPasswordNotification::class);
});

it('refuses a caller who is already logged in with 403 and sends nothing', function (): void {
    Notification::fake();
    $ann = User::factory()->create(['email' => 'ann@example.com']);

    $this->actingAs($ann)
        ->postJson(FORGOT_URL, ['email' => 'ann@example.com'])
        ->assertForbidden();

    Notification::assertNothingSent();
});

it('rejects a missing or bad email with 422', function (array $body): void {
    Notification::fake();

    $this->postJson(FORGOT_URL, $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    Notification::assertNothingSent();
})->with([
    'missing' => [[]],
    'not an email' => [['email' => 'not-an-email']],
    'not a string' => [['email' => ['ann@example.com']]],
]);

it('answers 429 on the 6th try in a minute from one IP, even with different emails', function (): void {
    Notification::fake();

    foreach (range(1, 5) as $try) {
        $this->postJson(FORGOT_URL, ['email' => "person{$try}@example.com"])->assertAccepted();
    }

    $this->postJson(FORGOT_URL, ['email' => 'person6@example.com'])
        ->assertTooManyRequests();
});

it('counts the limit per IP, not shared', function (): void {
    Notification::fake();

    foreach (range(1, 5) as $try) {
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->postJson(FORGOT_URL, ['email' => "person{$try}@example.com"])
            ->assertAccepted();
    }
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
        ->postJson(FORGOT_URL, ['email' => 'person6@example.com'])
        ->assertTooManyRequests();

    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
        ->postJson(FORGOT_URL, ['email' => 'person6@example.com'])
        ->assertAccepted();
});
