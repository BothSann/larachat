<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\Pivot;

#[Fillable(['role', 'joined_at'])]
final class ConversationParticipant extends Pivot
{
    /**
     * The table has its own auto-incrementing id.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => ParticipantRole::class,
            'joined_at' => 'datetime',
        ];
    }
}
