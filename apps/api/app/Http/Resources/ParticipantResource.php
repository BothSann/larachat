<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Knuckles\Scribe\Attributes\ResponseField;

/**
 * A user inside a conversation: their public fields plus their role.
 *
 * @mixin User
 *
 * @property-read ConversationParticipant $pivot
 */
final class ParticipantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    #[ResponseField('role', 'string', 'owner, admin or member. Both people in a direct conversation are member.', enum: ['owner', 'admin', 'member'])]
    public function toArray(Request $request): array
    {
        return [
            ...PublicUserResource::make($this->resource)->toArray($request),
            'role' => $this->whenPivotLoaded('conversation_participants', fn (): mixed => $this->pivot->role),
        ];
    }
}
