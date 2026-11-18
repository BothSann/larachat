import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
			<h1 className="text-4xl font-bold">LaraChat</h1>
			<p className="text-muted-foreground">Chat in real time. Coming soon.</p>
			<Button type="button">Get started</Button>
		</main>
	);
}
