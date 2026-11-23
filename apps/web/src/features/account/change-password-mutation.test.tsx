import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ApiError } from "#/lib/api-error";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";
import { useChangePassword } from "./mutations";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

const body = {
	current_password: "old-secret-password",
	password: "new-secret-password",
	password_confirmation: "new-secret-password",
};

function setup() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY } },
	});
	queryClient.setQueryData(["me"], ada);
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	const { result } = renderHook(() => useChangePassword(), { wrapper });
	return { queryClient, result };
}

describe("useChangePassword", () => {
	it("sends PUT /me/password with the three fields and the XSRF header", async () => {
		const sent: { body: unknown; xsrf: string | null }[] = [];
		server.use(
			http.put(`${API}/me/password`, async ({ request }) => {
				sent.push({
					body: await request.json(),
					xsrf: request.headers.get("X-XSRF-TOKEN"),
				});
				return new HttpResponse(null, { status: 204 });
			}),
		);
		const { result } = setup();

		result.current.mutate(body);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sent).toEqual([{ body, xsrf: "test-token" }]);
	});

	it("leaves the cache alone on 204: no user data changed", async () => {
		server.use(
			http.put(
				`${API}/me/password`,
				() => new HttpResponse(null, { status: 204 }),
			),
		);
		const { queryClient, result } = setup();

		result.current.mutate(body);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryData(["me"])).toEqual(ada);
		expect(queryClient.getQueryState(["me"])?.isInvalidated).toBe(false);
	});

	it("fails with the 422 field errors from Laravel", async () => {
		server.use(
			http.put(`${API}/me/password`, () =>
				HttpResponse.json(
					{
						message: "The password is incorrect.",
						errors: { current_password: ["The password is incorrect."] },
					},
					{ status: 422 },
				),
			),
		);
		const { result } = setup();

		result.current.mutate(body);

		await waitFor(() => expect(result.current.isError).toBe(true));
		const error = result.current.error as ApiError;
		expect(error.status).toBe(422);
		expect(error.errors.current_password).toEqual([
			"The password is incorrect.",
		]);
	});
});
