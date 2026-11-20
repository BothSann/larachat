import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest/login")({ component: Login });

function Login() {
	return (
		<main className="p-8">
			<h1 className="text-2xl font-bold">Log in</h1>
			<p className="text-muted-foreground">
				Login form comes in the next lesson.
			</p>
		</main>
	);
}
