import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";
import { useResendVerification } from "./mutations";

const RESEND = `${API}/auth/email/verification-notification`;

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function setup() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	queryClient.setQueryData(["me"], ada);
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	const { result } = renderHook(() => useResendVerification(), { wrapper });
	return { queryClient, result };
}

describe("useResendVerification", () => {
	it("sends one POST and returns 'sent' on 202", async () => {
		let calls = 0;
		server.use(
			http.post(RESEND, () => {
				calls++;
				return new HttpResponse(null, { status: 202 });
			}),
		);
		const { result } = setup();

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toBe("sent");
		expect(calls).toBe(1);
	});

	it("treats 409 already_verified as success and marks ['me'] stale", async () => {
		server.use(
			http.post(RESEND, () =>
				HttpResponse.json(
					{
						message: "Your email is already verified.",
						code: "already_verified",
					},
					{ status: 409 },
				),
			),
		);
		const { queryClient, result } = setup();

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toBe("already_verified");
		expect(result.current.error).toBeNull();
		// Nothing on screen watches ['me'] here, so it is only marked stale.
		// verify-banner.test.tsx proves the refetch when the banner watches it.
		expect(queryClient.getQueryState(["me"])?.isInvalidated).toBe(true);
	});

	it("fails with the API message on 429", async () => {
		server.use(
			http.post(RESEND, () =>
				HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
			),
		);
		const { result } = setup();

		result.current.mutate();

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.message).toBe("Too Many Attempts.");
	});
});
