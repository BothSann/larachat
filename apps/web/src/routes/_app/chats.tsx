import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { useLogout } from "#/features/auth/mutations";
import { meQuery } from "#/features/auth/queries";

export const Route = createFileRoute("/_app/chats")({
	component: Chats,
});

function Chats() {
	const { data: user } = useSuspenseQuery(meQuery);
	const logout = useLogout();
	const navigate = useNavigate();

	return (
		<main className="p-8">
			<p>Signed in as {user.name}</p>

			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					disabled={logout.isPending}
					onClick={() =>
						logout.mutate(undefined, {
							onSuccess: () =>
								navigate({
									to: "/login",
								}),
						})
					}
				>
					Log out
				</Button>

				{logout.error && (
					<p role="alert" className="text-destructive text-sm">
						{logout.error.message}
					</p>
				)}
			</div>
		</main>
	);
}
