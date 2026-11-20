import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { meQuery } from "#/features/auth/queries";

export const Route = createFileRoute("/_app/chats")({
	component: Chats,
});

function Chats() {
	const { data: user } = useSuspenseQuery(meQuery);

	return (
		<main className="p-8">
			<p>Signed in as {user.name}</p>
		</main>
	);
}
