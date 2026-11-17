<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Schema;

it('reports the app as healthy', function (): void {
    $this->get('/up')->assertOk();
});

it('hands out an XSRF-TOKEN cookie', function (): void {
    $this->get('/sanctum/csrf-cookie')
        ->assertNoContent()
        ->assertCookie('XSRF-TOKEN');
});

it('serves api routes under /api/v1', function (): void {
    $this->getJson('/api/v1/user')
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Unauthenticated.']);
});

it('returns the logged-in user from the api', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/user')
        ->assertOk()
        ->assertJsonPath('id', $user->id);
});

it('lets the web app at localhost:3000 send cookies', function (): void {
    $this->withHeaders([
        'Origin' => 'http://localhost:3000',
        'Access-Control-Request-Method' => 'POST',
    ])->options('/api/v1/user')
        ->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
        ->assertHeader('Access-Control-Allow-Credentials', 'true');
});

it('refuses other origins', function (): void {
    $response = $this->withHeaders([
        'Origin' => 'http://evil.test',
        'Access-Control-Request-Method' => 'POST',
    ])->options('/api/v1/user');

    expect($response->headers->get('Access-Control-Allow-Origin'))
        ->not->toBe('http://evil.test');
});

it('keeps the token table ready for ULID users', function (): void {
    expect(Schema::getColumnType('personal_access_tokens', 'tokenable_id'))->toBe('bpchar');
});
