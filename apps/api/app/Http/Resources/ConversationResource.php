<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Knuckles\Scribe\Attributes\ResponseField;

/** @mixin Conversation */
final class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    #[ResponseField('id', 'string', 'ULID.')]
    #[ResponseField('type', 'string', 'direct or group.', enum: ['direct', 'group'])]
    #[ResponseField('name', 'string', 'Group name. null for a direct conversation.', nullable: true)]
    #[ResponseField('last_message_at', 'string', 'When the last message was sent, ISO-8601 UTC. null before the first message.', nullable: true)]
    #[ResponseField('created_at', 'string', 'ISO-8601 UTC.')]
    #[ResponseField('participants', 'object[]', 'Everyone in the conversation, you included.')]
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->name,
            'last_message_at' => $this->last_message_at,
            'created_at' => $this->created_at,
            'participants' => ParticipantResource::collection($this->whenLoaded('participants')),
        ];
    }
}
