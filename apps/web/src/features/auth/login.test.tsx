import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada, fakeMe, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

const LOGIN = `${API}/auth/login`;

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function fillIn(email: string, password: string) {
	fireEvent.change(screen.getByLabelText("Email"), {
		target: { value: email },
	});
	fireEvent.change(screen.getByLabelText("Password"), {
		target: { value: password },
	});
	fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

describe("login form", () => {
	it("logs in, goes to the redirect, and skips a second GET /me", async () => {
		let signedIn = false;
		const meCalls = fakeMe(() => signedIn);
		server.use(
			http.post(LOGIN, () => {
				signedIn = true;
				return HttpResponse.json({ data: ada });
			}),
		);
		const { router } = await renderAt("/login?redirect=%2Fchats");
		const callsBeforeLogin = meCalls();

		fillIn("ada@example.com", "secret-password");

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect(router.state.location.pathname).toBe("/chats");
		expect(meCalls()).toBe(callsBeforeLogin);
	});

	it("shows the 422 message under the email field", async () => {
		fakeMe(() => false);
		server.use(
			http.post(LOGIN, () =>
				HttpResponse.json(
					{
						message: "These credentials do not match our records.",
						errors: {
							email: ["These credentials do not match our records."],
						},
					},
					{ status: 422 },
				),
			),
		);
		await renderAt("/login");

		fillIn("ada@example.com", "wrong-password");

		const error = await screen.findByText(
			"These credentials do not match our records.",
		);
		const email = screen.getByLabelText("Email");
		expect(email.getAttribute("aria-invalid")).toBe("true");
		expect(email.getAttribute("aria-describedby")).toBe(error.id);
	});

	it("shows a 429 above the form and keeps the form usable", async () => {
		fakeMe(() => false);
		server.use(
			http.post(LOGIN, () =>
				HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
			),
		);
		await renderAt("/login");

		fillIn("ada@example.com", "secret-password");

		expect((await screen.findByRole("alert")).textContent).toBe(
			"Too Many Attempts.",
		);
		const button = screen.getByRole("button", { name: "Continue" });
		expect((button as HTMLButtonElement).disabled).toBe(false);
	});

	it("stops a bad email before any request", async () => {
		fakeMe(() => false);
		let posts = 0;
		server.use(
			http.post(LOGIN, () => {
				posts++;
				return HttpResponse.json({ data: ada });
			}),
		);
		await renderAt("/login");

		fillIn("nope", "secret-password");

		expect(
			await screen.findByText("Enter a valid email address."),
		).toBeTruthy();
		expect(posts).toBe(0);
	});

	it("disables the button while the request is pending", async () => {
		fakeMe(() => false);
		let release = () => {};
		server.use(
			http.post(LOGIN, async () => {
				await new Promise<void>((resolve) => {
					release = resolve;
				});
				return HttpResponse.json({ data: ada });
			}),
		);
		await renderAt("/login");

		fillIn("ada@example.com", "secret-password");

		const button = await screen.findByRole("button", { name: "Logging in…" });
		expect((button as HTMLButtonElement).disabled).toBe(true);
		release();
		await waitFor(() => expect(screen.queryByText("Logging in…")).toBeNull());
	});
});
