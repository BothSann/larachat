import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { LoginForm } from "#/features/auth/components/login-form";
import { loginSearchSchema } from "#/features/auth/schemas";

export const Route = createFileRoute("/_guest/login")({
	validateSearch: loginSearchSchema,
	component: Login,
});

function Login() {
	const { redirect, reset } = Route.useSearch();
	const navigate = useNavigate();

	return (
		<main className="p-8">
			{reset && (
				<div role="status" className="mb-4 flex items-center gap-3">
					<p>Your password is reset. Log in with your new password.</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							navigate({
								to: "/login",
								search: { redirect },
								replace: true,
							})
						}
					>
						Dismiss
					</Button>
				</div>
			)}

			<h1 className="text-2xl font-bold">Log in</h1>
			<LoginForm redirect={redirect} />
			<p className="mt-4 text-sm">
				No account?{" "}
				<Link to="/register" search={{ redirect }} className="underline">
					Sign up
				</Link>
			</p>
		</main>
	);
}
