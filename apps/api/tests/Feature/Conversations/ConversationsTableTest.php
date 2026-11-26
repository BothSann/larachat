<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * @param  array<string, mixed>  $overrides
 */
function insertConversationRow(User $creator, array $overrides = []): string
{
    $id = (string) Str::ulid();

    DB::table('conversations')->insert([
        'id' => $id,
        'type' => 'group',
        'name' => 'Team',
        'direct_key' => null,
        'created_by' => $creator->id,
        'created_at' => now(),
        'updated_at' => now(),
        ...$overrides,
    ]);

    return $id;
}

it('has the planned columns', function (): void {
    expect(Schema::hasColumns('conversations', [
        'id', 'type', 'name', 'direct_key', 'created_by', 'last_message_at', 'created_at', 'updated_at',
    ]))->toBeTrue();
});

it('indexes created_by and last_message_at', function (): void {
    $indexed = collect(Schema::getIndexes('conversations'))->pluck('columns')->all();

    expect($indexed)->toContain(['created_by'])
        ->toContain(['last_message_at'])
        ->toContain(['direct_key']);
});

it('refuses a second conversation with the same direct_key', function (): void {
    $ann = User::factory()->create();
    insertConversationRow($ann, ['type' => 'direct', 'name' => null, 'direct_key' => 'a:b']);

    expect(fn () => insertConversationRow($ann, ['type' => 'direct', 'name' => null, 'direct_key' => 'a:b']))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('allows many conversations without a direct_key', function (): void {
    $ann = User::factory()->create();
    insertConversationRow($ann);
    insertConversationRow($ann);

    expect(DB::table('conversations')->count())->toBe(2);
});

it('refuses a creator who is not a user', function (): void {
    $ghost = User::factory()->make(['id' => (string) Str::ulid()]);

    expect(fn () => insertConversationRow($ghost))->toThrow(QueryException::class);
});

it('refuses to delete a user who started a conversation', function (): void {
    $ann = User::factory()->create();
    insertConversationRow($ann);

    expect(fn () => $ann->delete())->toThrow(QueryException::class);
});
