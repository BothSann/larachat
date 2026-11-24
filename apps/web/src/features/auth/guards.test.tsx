import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { routeTree } from "#/routeTree.gen";
import { server } from "#/test/server";

const ME = "http://api.test/api/v1/me";

const ada = {
	id: "01jd0000000000000000000000",
	name: "Ada",
	username: "ada",
	email: "ada@example.com",
	email_verified_at: null,
	created_at: "2026-11-19T00:00:00.000000Z",
};

function signedIn() {
	let calls = 0;
	server.use(
		http.get(ME, () => {
			calls++;
			return HttpResponse.json({ data: ada });
		}),
	);
	return () => calls;
}

function signedOut() {
	server.use(
		http.get(ME, () =>
			HttpResponse.json({ message: "Unauthenticated." }, { status: 401 }),
		),
	);
}

async function renderAt(url: string) {
	// Same staleTime as src/router.tsx, so a just-fetched `me` counts as fresh.
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
	});
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: [url] }),
		context: { queryClient },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
	await router.load();
	return router;
}

describe("_app guard", () => {
	it("shows the signed-in user on /chats with one GET /me", async () => {
		const calls = signedIn();

		await renderAt("/chats");

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect(calls()).toBe(1);
	});

	it("sends a signed-out visitor to /login with a redirect back", async () => {
		signedOut();

		const router = await renderAt("/chats");

		expect(router.state.location.pathname).toBe("/login");
		expect(router.state.location.searchStr).toBe("?redirect=%2Fchats");
		expect(await screen.findByText("Log in")).toBeTruthy();
	});
});

describe("_guest guard", () => {
	it("sends a signed-in user from /login to /chats", async () => {
		signedIn();

		const router = await renderAt("/login");

		expect(router.state.location.pathname).toBe("/chats");
		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
	});

	it("ignores a redirect to another site", async () => {
		signedIn();

		const router = await renderAt("/login?redirect=%2F%2Fevil.com");

		expect(router.state.location.pathname).toBe("/chats");
	});

	it("lets a signed-out visitor see /login", async () => {
		signedOut();

		const router = await renderAt("/login");

		expect(router.state.location.pathname).toBe("/login");
		expect(await screen.findByText("Log in")).toBeTruthy();
	});
});
