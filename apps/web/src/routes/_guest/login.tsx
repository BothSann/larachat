import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "#/features/auth/components/login-form";

export const Route = createFileRoute("/_guest/login")({ component: Login });

function Login() {
	const { redirect } = Route.useSearch();

	return (
		<main className="p-8">
			<h1 className="text-2xl font-bold">Log in</h1>
			<LoginForm redirect={redirect} />
		</main>
	);
}
