import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

const verifiedAda = { ...ada, email_verified_at: "2026-11-21T10:00:00Z" };

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function meIs(user: typeof ada | typeof verifiedAda) {
	server.use(http.get(`${API}/me`, () => HttpResponse.json({ data: user })));
}

describe("verify banner in the _app layout", () => {
	it("shows on /chats above the page for an unverified user", async () => {
		meIs(ada);

		await renderAt("/chats");

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect(
			screen.getByText("Check your email to verify your account."),
		).toBeTruthy();
	});

	it("is gone for a verified user", async () => {
		meIs(verifiedAda);

		await renderAt("/chats");

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect(screen.queryByText(/verify your account/)).toBeNull();
	});
});

describe("/chats?verified=1", () => {
	it("says the email is verified when me is verified", async () => {
		meIs(verifiedAda);

		const { router } = await renderAt("/chats?verified=1");

		expect(await screen.findByText("Your email is verified.")).toBeTruthy();
		expect(router.state.location.search).toEqual({ verified: 1 });
	});

	it("shows only the banner when me is still unverified", async () => {
		meIs(ada);

		await renderAt("/chats?verified=1");

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect(screen.queryByText("Your email is verified.")).toBeNull();
		expect(screen.getByText(/verify your account/)).toBeTruthy();
	});

	it("ignores ?verified=abc without crashing", async () => {
		meIs(verifiedAda);

		const { router } = await renderAt("/chats?verified=abc");

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect(screen.queryByText("Your email is verified.")).toBeNull();
		expect(router.state.location.search).toEqual({});
	});

	it("Dismiss replaces the URL with /chats and hides the message", async () => {
		meIs(verifiedAda);
		const { router } = await renderAt("/chats?verified=1");
		const lengthBefore = router.history.length;

		fireEvent.click(await screen.findByRole("button", { name: "Dismiss" }));

		await waitFor(() => expect(router.state.location.href).toBe("/chats"));
		expect(screen.queryByText("Your email is verified.")).toBeNull();
		expect(router.history.length).toBe(lengthBefore);
	});

	it("logged out: goes to login, then back to /chats?verified=1", async () => {
		let signedIn = false;
		server.use(
			http.get(`${API}/me`, () =>
				signedIn
					? HttpResponse.json({ data: verifiedAda })
					: HttpResponse.json({ message: "Unauthenticated." }, { status: 401 }),
			),
			http.post(`${API}/auth/login`, () => {
				signedIn = true;
				return HttpResponse.json({ data: verifiedAda });
			}),
		);

		const { router } = await renderAt("/chats?verified=1");

		expect(router.state.location.pathname).toBe("/login");
		expect(router.state.location.searchStr).toBe(
			"?redirect=%2Fchats%3Fverified%3D1",
		);

		fireEvent.change(await screen.findByLabelText("Email"), {
			target: { value: "ada@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "secret-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Continue" }));

		expect(await screen.findByText("Your email is verified.")).toBeTruthy();
		expect(router.state.location.href).toBe("/chats?verified=1");
	});
});
