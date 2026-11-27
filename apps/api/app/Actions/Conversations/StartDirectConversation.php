<?php

declare(strict_types=1);

namespace App\Actions\Conversations;

use App\Data\StartDirectConversationData;
use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class StartDirectConversation
{
    /**
     * The direct conversation between the caller and the other user. New if they had none.
     */
    public function handle(User $caller, StartDirectConversationData $data): Conversation
    {
        return DB::transaction(function () use ($caller, $data): Conversation {
            $conversation = Conversation::createOrFirst(
                ['direct_key' => $this->directKey($caller->id, $data->userId)],
                ['type' => ConversationType::Direct, 'created_by' => $caller->id],
            );

            if ($conversation->wasRecentlyCreated) {
                $conversation->participants()->attach([
                    $caller->id => ['role' => ParticipantRole::Member, 'joined_at' => now()],
                    $data->userId => ['role' => ParticipantRole::Member, 'joined_at' => now()],
                ]);
            }

            return $conversation->load('participants');
        });
    }

    /**
     * The same key whichever user asks: "<smaller id>:<larger id>".
     */
    private function directKey(string $userId, string $otherUserId): string
    {
        [$low, $high] = $userId < $otherUserId
            ? [$userId, $otherUserId]
            : [$otherUserId, $userId];

        return $low.':'.$high;
    }
}
