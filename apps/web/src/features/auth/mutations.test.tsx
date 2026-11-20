import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";
import { useLogin } from "./mutations";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

describe("useLogin", () => {
	it("wipes the old cache and puts the new user into ['me']", async () => {
		server.use(
			http.post(`${API}/auth/login`, () => HttpResponse.json({ data: ada })),
		);
		const queryClient = new QueryClient();
		queryClient.setQueryData(["conversations", "list"], ["from the last user"]);
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		const { result } = renderHook(() => useLogin(), { wrapper });

		result.current.mutate({ email: "ada@example.com", password: "secret" });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(queryClient.getQueryData(["me"])).toEqual(ada);
		expect(queryClient.getQueryData(["conversations", "list"])).toBeUndefined();
	});
});
