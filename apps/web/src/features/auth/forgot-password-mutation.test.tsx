import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "#/lib/api-error";
import { clearCookie, setCookie } from "#/test/cookies";
import { API } from "#/test/render-at";
import { server } from "#/test/server";
import { useForgotPassword } from "./mutations";

const FORGOT = `${API}/auth/forgot-password`;

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function setup() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	const { result } = renderHook(() => useForgotPassword(), { wrapper });
	return { queryClient, result };
}

describe("useForgotPassword", () => {
	it("sends one POST with the email and the XSRF header", async () => {
		const requests: { body: unknown; xsrf: string | null }[] = [];
		server.use(
			http.post(FORGOT, async ({ request }) => {
				requests.push({
					body: await request.json(),
					xsrf: request.headers.get("X-XSRF-TOKEN"),
				});
				return new HttpResponse(null, { status: 202 });
			}),
		);
		const { result } = setup();

		result.current.mutate({ email: "ada@example.com" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(requests).toEqual([
			{ body: { email: "ada@example.com" }, xsrf: "test-token" },
		]);
	});

	it("leaves the Query cache alone on success", async () => {
		server.use(
			http.post(FORGOT, () => new HttpResponse(null, { status: 202 })),
		);
		const { queryClient, result } = setup();

		result.current.mutate({ email: "ada@example.com" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryCache().getAll()).toEqual([]);
	});

	it("fails with an ApiError of status 429 when rate limited", async () => {
		server.use(
			http.post(FORGOT, () =>
				HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
			),
		);
		const { result } = setup();

		result.current.mutate({ email: "ada@example.com" });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toBeInstanceOf(ApiError);
		expect((result.current.error as ApiError).status).toBe(429);
	});
});
