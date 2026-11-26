<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Conversation>
 */
final class ConversationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => ConversationType::Group,
            'name' => fake()->words(2, true),
            'direct_key' => null,
            'created_by' => User::factory(),
            'last_message_at' => null,
        ];
    }

    /**
     * A direct conversation: no name, and a direct_key unique to the pair.
     */
    public function direct(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ConversationType::Direct,
            'name' => null,
            'direct_key' => fake()->unique()->regexify('[0-9A-Z]{26}:[0-9A-Z]{26}'),
        ]);
    }

    /**
     * A group conversation with a name.
     */
    public function group(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ConversationType::Group,
            'name' => fake()->words(2, true),
            'direct_key' => null,
        ]);
    }
}
