import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";
import { useRegister } from "./mutations";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

describe("useRegister", () => {
	it("sends every field, wipes the old cache, and puts the new user into ['me']", async () => {
		let sent: unknown;
		server.use(
			http.post(`${API}/auth/register`, async ({ request }) => {
				sent = await request.json();
				return HttpResponse.json({ data: ada }, { status: 201 });
			}),
		);
		const queryClient = new QueryClient();
		queryClient.setQueryData(["conversations", "list"], ["from the last user"]);
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		const { result } = renderHook(() => useRegister(), { wrapper });
		const input = {
			name: "Ada",
			username: "ada",
			email: "ada@example.com",
			password: "secret123",
			password_confirmation: "secret123",
		};

		result.current.mutate(input);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sent).toEqual(input);
		expect(queryClient.getQueryData(["me"])).toEqual(ada);
		expect(queryClient.getQueryData(["conversations", "list"])).toBeUndefined();
	});
});
