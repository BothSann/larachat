import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { delay, HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";
import { VerifyBanner } from "./verify-banner";

const RESEND = `${API}/auth/email/verification-notification`;
const verifiedAda = { ...ada, email_verified_at: "2026-11-21T10:00:00Z" };

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function renderBanner(me: typeof ada | typeof verifiedAda) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } },
	});
	queryClient.setQueryData(["me"], me);
	render(
		<QueryClientProvider client={queryClient}>
			<VerifyBanner />
		</QueryClientProvider>,
	);
}

const button = () =>
	screen.getByRole("button", { name: /resend email|sending/i });

describe("VerifyBanner", () => {
	it("shows the notice and button for an unverified user", () => {
		renderBanner(ada);

		expect(
			screen.getByText("Check your email to verify your account."),
		).toBeTruthy();
		expect(button().textContent).toBe("Resend email");
	});

	it("shows nothing for a verified user", () => {
		renderBanner(verifiedAda);

		expect(screen.queryByText(/verify your account/)).toBeNull();
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("disables the button while sending, then says Sent on 202", async () => {
		server.use(
			http.post(RESEND, async () => {
				await delay(50);
				return new HttpResponse(null, { status: 202 });
			}),
		);
		renderBanner(ada);

		fireEvent.click(button());

		await waitFor(() => expect(button().textContent).toBe("Sending…"));
		expect((button() as HTMLButtonElement).disabled).toBe(true);
		expect(await screen.findByText("Sent. Check your inbox.")).toBeTruthy();
		expect((button() as HTMLButtonElement).disabled).toBe(false);
	});

	it("hides itself after a 409 once the fresh me is verified, with no error", async () => {
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
			http.get(`${API}/me`, () => HttpResponse.json({ data: verifiedAda })),
		);
		renderBanner(ada);

		fireEvent.click(button());

		await waitFor(() =>
			expect(screen.queryByText(/verify your account/)).toBeNull(),
		);
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("shows the 429 message in an alert and enables the button again", async () => {
		server.use(
			http.post(RESEND, () =>
				HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
			),
		);
		renderBanner(ada);

		fireEvent.click(button());

		expect((await screen.findByRole("alert")).textContent).toBe(
			"Too Many Attempts.",
		);
		expect((button() as HTMLButtonElement).disabled).toBe(false);
	});

	it("shows a server error in an alert", async () => {
		server.use(
			http.post(RESEND, () =>
				HttpResponse.json({ message: "Server Error" }, { status: 500 }),
			),
		);
		renderBanner(ada);

		fireEvent.click(button());

		expect((await screen.findByRole("alert")).textContent).toBe("Server Error");
	});
});
