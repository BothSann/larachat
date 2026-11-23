import { createFileRoute } from "@tanstack/react-router";
import { BrokenResetLink } from "#/features/auth/components/broken-reset-link";
import { ResetPasswordForm } from "#/features/auth/components/reset-password-form";
import { resetPasswordSearchSchema } from "#/features/auth/schemas";

export const Route = createFileRoute("/_guest/reset-password")({
	validateSearch: resetPasswordSearchSchema,
	component: ResetPassword,
});

function ResetPassword() {
	const { token, email } = Route.useSearch();

	return (
		<main className="p-8">
			<h1 className="mb-4 text-2xl font-bold">Set a new password</h1>
			{token && email ? (
				<ResetPasswordForm token={token} email={email} />
			) : (
				<BrokenResetLink />
			)}
		</main>
	);
}
