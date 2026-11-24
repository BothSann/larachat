import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { routeTree } from "#/routeTree.gen";
import { server } from "./server";

export const API = "http://api.test/api/v1";

export const ada = {
	id: "01jd0000000000000000000000",
	name: "Ada",
	username: "ada",
	email: "ada@example.com",
	email_verified_at: null,
	created_at: "2026-11-19T00:00:00.000000Z",
};

// Fakes GET /me. Returns a counter of how many times it was called.
export function fakeMe(signedIn: () => boolean) {
	let calls = 0;
	server.use(
		http.get(`${API}/me`, () => {
			calls++;
			return signedIn()
				? HttpResponse.json({ data: ada })
				: HttpResponse.json({ message: "Unauthenticated." }, { status: 401 });
		}),
	);
	return () => calls;
}

// Renders the real route tree at `url` with a fresh QueryClient.
export async function renderAt(url: string) {
	// Same staleTime as src/router.tsx, so a just-set `me` counts as fresh.
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
	return { router, queryClient };
}
