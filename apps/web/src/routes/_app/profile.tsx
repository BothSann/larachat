import { createFileRoute, Link } from "@tanstack/react-router";
import { ChangePasswordForm } from "#/features/account/components/change-password-form";
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
			<section className="grid gap-4">
				<h2 className="font-bold text-lg">Change password</h2>
				<ChangePasswordForm />
			</section>
		</main>
	);
}
