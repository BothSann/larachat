import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "#/lib/api-error";
import { clearCookie, setCookie } from "#/test/cookies";
import { API } from "#/test/render-at";
import { server } from "#/test/server";
import { useResetPassword } from "./mutations";

const RESET = `${API}/auth/reset-password`;
const BODY = {
	token: "abc",
	email: "ada@example.com",
	password: "new-password-1",
	password_confirmation: "new-password-1",
};

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function setup() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	const { result } = renderHook(() => useResetPassword(), { wrapper });
	return { queryClient, result };
}

describe("useResetPassword", () => {
	it("sends one POST with all four fields and the XSRF header", async () => {
		const requests: { body: unknown; xsrf: string | null }[] = [];
		server.use(
			http.post(RESET, async ({ request }) => {
				requests.push({
					body: await request.json(),
					xsrf: request.headers.get("X-XSRF-TOKEN"),
				});
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const { result } = setup();

		result.current.mutate(BODY);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(requests).toEqual([{ body: BODY, xsrf: "test-token" }]);
	});

	it("leaves the Query cache alone on success", async () => {
		server.use(http.post(RESET, () => new HttpResponse(null, { status: 204 })));
		const { queryClient, result } = setup();

		result.current.mutate(BODY);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryCache().getAll()).toEqual([]);
	});

	it("fails with the token error on a bad link", async () => {
		server.use(
			http.post(RESET, () =>
				HttpResponse.json(
					{
						message: "This reset link is invalid or has expired.",
						errors: { token: ["This reset link is invalid or has expired."] },
					},
					{ status: 422 },
				),
			),
		);
		const { result } = setup();

		result.current.mutate(BODY);

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error).toBeInstanceOf(ApiError);
		expect((result.current.error as ApiError).errors.token).toEqual([
			"This reset link is invalid or has expired.",
		]);
	});
});
