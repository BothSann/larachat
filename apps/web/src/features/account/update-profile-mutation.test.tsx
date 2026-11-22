import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";
import { useUpdateProfile } from "./mutations";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function setup() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY } },
	});
	queryClient.setQueryData(["me"], ada);
	queryClient.setQueryData(["conversations", "list"], ["still mine"]);
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	const { result } = renderHook(() => useUpdateProfile(), { wrapper });
	return { queryClient, result };
}

describe("useUpdateProfile", () => {
	it("sends PATCH /me with both fields and puts the reply into ['me']", async () => {
		const bodies: unknown[] = [];
		const saved = { ...ada, name: "Ada B", username: "bob" };
		server.use(
			http.patch(`${API}/me`, async ({ request }) => {
				bodies.push(await request.json());
				return HttpResponse.json({ data: saved });
			}),
		);
		const { queryClient, result } = setup();

		result.current.mutate({ name: "Ada B", username: "Bob" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(bodies).toEqual([{ name: "Ada B", username: "Bob" }]);
		expect(queryClient.getQueryData(["me"])).toEqual(saved);
		expect(result.current.data).toEqual(saved);
	});

	it("keeps the rest of the cache, because it's still the same user", async () => {
		server.use(
			http.patch(`${API}/me`, () =>
				HttpResponse.json({ data: { ...ada, name: "Ada B" } }),
			),
		);
		const { queryClient, result } = setup();

		result.current.mutate({ name: "Ada B", username: "ada" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryData(["conversations", "list"])).toEqual([
			"still mine",
		]);
	});

	it("leaves ['me'] alone when the server says 422", async () => {
		server.use(
			http.patch(`${API}/me`, () =>
				HttpResponse.json(
					{
						message: "The username has already been taken.",
						errors: { username: ["The username has already been taken."] },
					},
					{ status: 422 },
				),
			),
		);
		const { queryClient, result } = setup();

		result.current.mutate({ name: "Ada", username: "taken" });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(queryClient.getQueryData(["me"])).toEqual(ada);
	});
});
