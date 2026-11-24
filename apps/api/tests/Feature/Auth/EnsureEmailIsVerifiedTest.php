<?php

declare(strict_types=1);

use App\Exceptions\EmailNotVerified;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Route;

const VERIFIED_URL = '/api/v1/_test/verified';
const VERIFIED_ONLY_URL = '/api/v1/_test/verified-only';

/**
 * No real route uses `verified` yet, so these exist only while this file runs.
 * Requests pretend to come from the web app, like the other auth tests.
 */
beforeEach(function (): void {
    $this->withHeader('Referer', 'http://localhost:3000');

    $answer = fn (): JsonResponse => response()->json(['ok' => true]);

    Route::middleware(['api', 'auth:sanctum', 'verified'])->get(VERIFIED_URL, $answer);
    Route::middleware(['api', 'verified'])->get(VERIFIED_ONLY_URL, $answer);
});

it('lets a verified user through', function (): void {
    $this->actingAs(User::factory()->create())
        ->getJson(VERIFIED_URL)
        ->assertOk()
        ->assertExactJson(['ok' => true]);
});

it('refuses an unverified user with 403 email_not_verified', function (): void {
    $this->actingAs(User::factory()->unverified()->create())
        ->getJson(VERIFIED_URL)
        ->assertForbidden()
        ->assertExactJson([
            'message' => 'Your email address is not verified.',
            'code' => 'email_not_verified',
        ]);
});

it('sends the same 403 when the request does not ask for JSON', function (): void {
    $this->actingAs(User::factory()->unverified()->create())
        ->get(VERIFIED_URL)
        ->assertForbidden()
        ->assertExactJson([
            'message' => 'Your email address is not verified.',
            'code' => 'email_not_verified',
        ]);
});

it('does not log the refusal as an error', function (): void {
    Exceptions::fake();

    $this->actingAs(User::factory()->unverified()->create())
        ->getJson(VERIFIED_URL)
        ->assertForbidden()
        ->assertJsonPath('code', 'email_not_verified');

    Exceptions::assertNotReported(EmailNotVerified::class);
});

it('refuses a guest with 401', function (): void {
    $this->getJson(VERIFIED_URL)
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});

it('refuses a guest with 401 even if the route forgot auth:sanctum', function (): void {
    $this->getJson(VERIFIED_ONLY_URL)
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});

it('still lets an unverified user see who they are', function (): void {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.email_verified_at', null);
});
