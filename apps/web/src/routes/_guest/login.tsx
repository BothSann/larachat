import { createFileRoute, Link } from "@tanstack/react-router";
import { LoginForm } from "#/features/auth/components/login-form";

export const Route = createFileRoute("/_guest/login")({ component: Login });

function Login() {
	const { redirect } = Route.useSearch();

	return (
		<main className="p-8">
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
