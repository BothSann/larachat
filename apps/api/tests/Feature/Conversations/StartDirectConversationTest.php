<?php

declare(strict_types=1);

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

const START_DIRECT_URL = '/api/v1/conversations/direct';

beforeEach(function (): void {
    $this->ann = User::factory()->create(['name' => 'Ann', 'username' => 'ann']);
    $this->bob = User::factory()->create(['name' => 'Bob', 'username' => 'bob']);
});

it('starts a direct conversation and answers 201', function (): void {
    $response = $this->actingAs($this->ann)
        ->postJson(START_DIRECT_URL, ['user_id' => $this->bob->id])
        ->assertCreated()
        ->assertExactJsonStructure(['data' => [
            'id', 'type', 'name', 'last_message_at', 'created_at',
            'participants' => ['*' => ['id', 'name', 'username', 'role']],
        ]])
        ->assertJsonPath('data.type', 'direct')
        ->assertJsonPath('data.name', null)
        ->assertJsonPath('data.last_message_at', null)
        ->assertJsonCount(2, 'data.participants');

    expect(collect($response->json('data.participants'))->pluck('role')->unique()->all())->toBe(['member'])
        ->and(collect($response->json('data.participants'))->pluck('username')->sort()->values()->all())->toBe(['ann', 'bob']);

    $this->assertDatabaseHas('conversations', [
        'id' => $response->json('data.id'),
        'type' => 'direct',
        'created_by' => $this->ann->id,
        'direct_key' => collect([$this->ann->id, $this->bob->id])->sort()->implode(':'),
    ]);
    $this->assertDatabaseCount('conversation_participants', 2);
});

it('answers 200 with the same conversation when either user asks again', function (): void {
    $id = $this->actingAs($this->ann)->postJson(START_DIRECT_URL, ['user_id' => $this->bob->id])->assertCreated()->json('data.id');

    $this->actingAs($this->ann)->postJson(START_DIRECT_URL, ['user_id' => $this->bob->id])
        ->assertOk()
        ->assertJsonPath('data.id', $id)
        ->assertJsonCount(2, 'data.participants');

    $this->actingAs($this->bob)->postJson(START_DIRECT_URL, ['user_id' => $this->ann->id])
        ->assertOk()
        ->assertJsonPath('data.id', $id);

    expect(Conversation::count())->toBe(1);
    $this->assertDatabaseCount('conversation_participants', 2);
});

it('loads the participants with a fixed number of queries', function (): void {
    $this->actingAs($this->ann)->postJson(START_DIRECT_URL, ['user_id' => $this->bob->id])->assertCreated();

    DB::enableQueryLog();
    $this->actingAs($this->ann)->postJson(START_DIRECT_URL, ['user_id' => $this->bob->id])->assertOk();
    $selects = collect(DB::getQueryLog())->filter(fn (array $query): bool => str_starts_with(mb_strtolower($query['query']), 'select'));

    // exists check, conversation lookup after the failed insert, participants.
    expect($selects)->toHaveCount(3);
});

it('refuses to start a conversation with yourself', function (): void {
    $this->actingAs($this->ann)->postJson(START_DIRECT_URL, ['user_id' => $this->ann->id])
        ->assertUnprocessable()
        ->assertExactJson([
            'message' => 'You cannot start a conversation with yourself.',
            'errors' => ['user_id' => ['You cannot start a conversation with yourself.']],
        ]);

    expect(Conversation::count())->toBe(0);
});

it('gives the same 422 for an unknown and an unverified user', function (): void {
    $carol = User::factory()->unverified()->create();
    $body = [
        'message' => 'The selected user is invalid.',
        'errors' => ['user_id' => ['The selected user is invalid.']],
    ];

    $this->actingAs($this->ann)->postJson(START_DIRECT_URL, ['user_id' => '01kb0m7v4qg5r8n3d2w6y9x1ze'])
        ->assertUnprocessable()->assertExactJson($body);
    $this->actingAs($this->ann)->postJson(START_DIRECT_URL, ['user_id' => $carol->id])
        ->assertUnprocessable()->assertExactJson($body);

    expect(Conversation::count())->toBe(0);
});

it('refuses a missing or malformed user_id', function (array $body): void {
    $this->actingAs($this->ann)->postJson(START_DIRECT_URL, $body)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('user_id');
})->with([
    'missing' => [[]],
    'not a ULID' => [['user_id' => 'bob']],
]);

it('refuses a logged-out caller with 401', function (): void {
    $this->postJson(START_DIRECT_URL, ['user_id' => $this->bob->id])->assertUnauthorized();
});

it('refuses an unverified caller with 403 email_not_verified', function (): void {
    $dan = User::factory()->unverified()->create();

    $this->actingAs($dan)->postJson(START_DIRECT_URL, ['user_id' => $this->bob->id])
        ->assertForbidden()
        ->assertExactJson(['message' => 'Your email address is not verified.', 'code' => 'email_not_verified']);
});
