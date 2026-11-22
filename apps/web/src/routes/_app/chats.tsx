import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { useLogout } from "#/features/auth/mutations";
import { meQuery } from "#/features/auth/queries";
import { chatsSearchSchema } from "#/features/auth/schemas";

export const Route = createFileRoute("/_app/chats")({
	validateSearch: chatsSearchSchema,
	component: Chats,
});

function Chats() {
	const { data: user } = useSuspenseQuery(meQuery);
	const logout = useLogout();
	const navigate = useNavigate();
	const { verified } = Route.useSearch();

	return (
		<main className="p-8">
			{verified && user.email_verified_at && (
				<div role="status" className="mb-4 flex items-center gap-3">
					<p>Your email is verified.</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							navigate({ to: "/chats", search: {}, replace: true })
						}
					>
						Dismiss
					</Button>
				</div>
			)}

			<div className="flex items-center gap-3">
				<p>Signed in as {user.name}</p>
				<Link to="/profile" className="text-sm underline">
					Profile
				</Link>
			</div>

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
