import { createFileRoute, Link } from "@tanstack/react-router";
import { RegisterForm } from "#/features/auth/components/register-form";

export const Route = createFileRoute("/_guest/register")({
	component: Register,
});

function Register() {
	const { redirect } = Route.useSearch();

	return (
		<main className="p-8">
			<h1 className="text-2xl font-bold">Create an account</h1>
			<RegisterForm redirect={redirect} />
			<p className="mt-4 text-sm">
				Have an account?{" "}
				<Link to="/login" search={{ redirect }} className="underline">
					Log in
				</Link>
			</p>
		</main>
	);
}
