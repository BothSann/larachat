import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, fakeMe, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

const RESET = `${API}/auth/reset-password`;
const GOOD = "/reset-password?token=abc&email=ada%40example.com";
const BROKEN = "This reset link is broken or expired.";
const NOTE = "Your password is reset. Log in with your new password.";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function submit(password: string, confirmation: string) {
	fireEvent.change(screen.getByLabelText("New password"), {
		target: { value: password },
	});
	fireEvent.change(screen.getByLabelText("Confirm password"), {
		target: { value: confirmation },
	});
	fireEvent.click(screen.getByRole("button", { name: "Set new password" }));
}

function accept() {
	const bodies: unknown[] = [];
	server.use(
		http.post(RESET, async ({ request }) => {
			bodies.push(await request.json());
			return new HttpResponse(null, { status: 204 });
		}),
	);
	return bodies;
}

function refuse(status: number, body: object) {
	server.use(http.post(RESET, () => HttpResponse.json(body, { status })));
}

describe("reset password page", () => {
	it("shows the email as text and two password fields", async () => {
		fakeMe(() => false);
		await renderAt(GOOD);

		expect(
			screen.getByText("Set a new password for ada@example.com"),
		).toBeTruthy();
		expect(screen.getByLabelText("New password")).toBeTruthy();
		expect(screen.getByLabelText("Confirm password")).toBeTruthy();
		expect(screen.queryByLabelText("Email")).toBeNull();
	});

	it("sends one POST, then replaces the page with /login?reset=1", async () => {
		fakeMe(() => false);
		const bodies = accept();
		const { router } = await renderAt(GOOD);

		submit("new-password-1", "new-password-1");

		expect((await screen.findByRole("status")).textContent).toContain(NOTE);
		expect(bodies).toEqual([
			{
				token: "abc",
				email: "ada@example.com",
				password: "new-password-1",
				password_confirmation: "new-password-1",
			},
		]);
		expect(router.state.location.pathname).toBe("/login");
		expect(router.state.location.search).toEqual({ reset: 1 });
		expect(router.history.length).toBe(1);
	});

	it("stops a short password before any request", async () => {
		fakeMe(() => false);
		const bodies = accept();
		await renderAt(GOOD);

		submit("short", "short");

		expect(await screen.findByText("Use at least 8 characters.")).toBeTruthy();
		expect(bodies).toEqual([]);
	});

	it("stops a mismatched confirmation before any request", async () => {
		fakeMe(() => false);
		const bodies = accept();
		await renderAt(GOOD);

		submit("new-password-1", "new-password-2");

		expect(await screen.findByText("Passwords don't match.")).toBeTruthy();
		expect(bodies).toEqual([]);
	});

	it.each([
		["no token", "/reset-password?email=ada%40example.com"],
		["an empty token", "/reset-password?token=&email=ada%40example.com"],
		["a bad email", "/reset-password?token=abc&email=nope"],
		["no params", "/reset-password"],
	])("shows the broken-link view for %s", async (_label, url) => {
		fakeMe(() => false);
		await renderAt(url);

		expect(screen.getByText(BROKEN)).toBeTruthy();
		expect(
			screen.getByRole("link", { name: "Get a new link" }).getAttribute("href"),
		).toBe("/forgot-password");
		expect(screen.queryByLabelText("New password")).toBeNull();
	});

	it("swaps the form for the broken-link view on a token 422", async () => {
		fakeMe(() => false);
		refuse(422, {
			message: "This reset link is invalid or has expired.",
			errors: { token: ["This reset link is invalid or has expired."] },
		});
		await renderAt(GOOD);

		submit("new-password-1", "new-password-1");

		expect(await screen.findByText(BROKEN)).toBeTruthy();
		expect(screen.queryByLabelText("New password")).toBeNull();
	});

	it("shows a password 422 under New password and keeps the form", async () => {
		fakeMe(() => false);
		refuse(422, {
			message: "The password field must contain at least one number.",
			errors: {
				password: ["The password field must contain at least one number."],
			},
		});
		await renderAt(GOOD);

		submit("new-password", "new-password");

		const error = await screen.findByText(
			"The password field must contain at least one number.",
		);
		const password = screen.getByLabelText("New password");
		expect(password.getAttribute("aria-describedby")).toBe(error.id);
		expect(screen.queryByText(BROKEN)).toBeNull();
	});

	it("shows a wait message on 429 and keeps the typed passwords", async () => {
		fakeMe(() => false);
		refuse(429, { message: "Too Many Attempts." });
		await renderAt(GOOD);

		submit("new-password-1", "new-password-1");

		expect((await screen.findByRole("alert")).textContent).toBe(
			"Too many tries. Wait a minute and try again.",
		);
		const password = screen.getByLabelText("New password") as HTMLInputElement;
		expect(password.value).toBe("new-password-1");
	});

	it("disables the button while the request is pending", async () => {
		fakeMe(() => false);
		let release = () => {};
		server.use(
			http.post(RESET, async () => {
				await new Promise<void>((resolve) => {
					release = resolve;
				});
				return new HttpResponse(null, { status: 204 });
			}),
		);
		await renderAt(GOOD);

		submit("new-password-1", "new-password-1");

		const button = await screen.findByRole("button", { name: "Saving…" });
		expect((button as HTMLButtonElement).disabled).toBe(true);
		release();
		await waitFor(() => expect(screen.queryByText("Saving…")).toBeNull());
	});

	it("sends a signed-in user away", async () => {
		fakeMe(() => true);
		const { router } = await renderAt(GOOD);

		expect(router.state.location.pathname).toBe("/chats");
	});
});
