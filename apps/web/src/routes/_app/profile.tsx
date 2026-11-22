import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfileForm } from "#/features/account/components/profile-form";

export const Route = createFileRoute("/_app/profile")({
	component: Profile,
});

function Profile() {
	return (
		<main className="grid gap-6 p-8">
			<Link to="/chats" className="text-sm underline">
				Back to chats
			</Link>
			<h1 className="font-semibold text-xl">Profile</h1>
			<ProfileForm />
		</main>
	);
}
