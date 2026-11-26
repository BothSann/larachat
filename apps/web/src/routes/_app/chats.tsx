import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { useLogout } from "#/features/auth/mutations";
import { meQuery } from "#/features/auth/queries";
import { chatsSearchSchema } from "#/features/auth/schemas";
import { SearchPeople } from "#/features/people/components/search-people";
import { peopleSearchSchema } from "#/features/people/schemas";

export const Route = createFileRoute("/_app/chats")({
	validateSearch: chatsSearchSchema.extend(peopleSearchSchema.shape),
	component: Chats,
});

function Chats() {
	const { data: user } = useSuspenseQuery(meQuery);
	const { verified } = Route.useSearch();

	const logout = useLogout();
	const navigate = Route.useNavigate();

	return (
		<main className="p-8">
			{verified && user.email_verified_at && (
				<div role="status" className="mb-4 flex items-center gap-3">
					<p>Your email is verified.</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							navigate({
								search: (prev) => ({
									...prev,
									verified: undefined,
								}),
								replace: true,
							})
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

			{user.email_verified_at ? (
				<SearchPeople />
			) : (
				<p>Verify your email to find people.</p>
			)}
		</main>
	);
}
