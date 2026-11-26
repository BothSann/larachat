<?php

declare(strict_types=1);

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

function insertParticipantRow(Conversation $conversation, User $user, string $role = 'member'): void
{
    DB::table('conversation_participants')->insert([
        'conversation_id' => $conversation->id,
        'user_id' => $user->id,
        'role' => $role,
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

it('has the planned columns', function (): void {
    expect(Schema::hasColumns('conversation_participants', [
        'id', 'conversation_id', 'user_id', 'role', 'joined_at', 'created_at', 'updated_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumn('conversation_participants', 'last_read_message_id'))->toBeFalse();
});

it('indexes user_id on its own and the pair together', function (): void {
    $indexes = collect(Schema::getIndexes('conversation_participants'));

    expect($indexes->pluck('columns')->all())->toContain(['user_id'])
        ->and($indexes->firstWhere('columns', ['conversation_id', 'user_id'])['unique'] ?? false)->toBeTrue();
});

it('refuses the same user twice in one conversation', function (): void {
    $conversation = Conversation::factory()->create();
    $ann = User::factory()->create();
    insertParticipantRow($conversation, $ann);

    expect(fn () => insertParticipantRow($conversation, $ann))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('lets one user join many conversations', function (): void {
    $ann = User::factory()->create();
    insertParticipantRow(Conversation::factory()->create(), $ann);
    insertParticipantRow(Conversation::factory()->create(), $ann);

    expect(DB::table('conversation_participants')->where('user_id', $ann->id)->count())->toBe(2);
});

it('removes the participants when the conversation is deleted', function (): void {
    $conversation = Conversation::factory()->create();
    insertParticipantRow($conversation, User::factory()->create());
    insertParticipantRow($conversation, User::factory()->create());

    $conversation->delete();

    expect(DB::table('conversation_participants')->count())->toBe(0);
});

it('refuses to delete a user who is a participant', function (): void {
    $ann = User::factory()->create();
    insertParticipantRow(Conversation::factory()->create(), $ann);

    expect(fn () => $ann->delete())->toThrow(QueryException::class);
});
