import { createFileRoute, Link } from "@tanstack/react-router";
import { ForgotPasswordForm } from "#/features/auth/components/forgot-password-form";

export const Route = createFileRoute("/_guest/forgot-password")({
	component: ForgotPassword,
});

function ForgotPassword() {
	const { redirect } = Route.useSearch();

	return (
		<main className="p-8">
			<h1 className="text-2xl font-bold">Forgot password</h1>
			<p className="mt-2 mb-4 text-sm">
				Enter your email and we'll send you a link to set a new password.
			</p>
			<ForgotPasswordForm />
			<p className="text-sm mt-4">
				<Link to="/login" search={{ redirect }} className="underline">
					Back to log in
				</Link>
			</p>
		</main>
	);
}
