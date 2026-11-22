import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, fakeMe, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

const FORGOT = `${API}/auth/forgot-password`;
const SENT =
	"If that email has an account, we've sent a reset link. Check your inbox.";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function send(email: string) {
	fireEvent.change(screen.getByLabelText("Email"), {
		target: { value: email },
	});
	fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
}

function accept() {
	const bodies: unknown[] = [];
	server.use(
		http.post(FORGOT, async ({ request }) => {
			bodies.push(await request.json());
			return new HttpResponse(null, { status: 202 });
		}),
	);
	return bodies;
}

describe("forgot password page", () => {
	it("shows an Email field and a send button", async () => {
		fakeMe(() => false);
		await renderAt("/forgot-password");

		expect(screen.getByLabelText("Email")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Send reset link" }),
		).toBeTruthy();
	});

	it("sends one POST and swaps the form for the fixed message", async () => {
		fakeMe(() => false);
		const bodies = accept();
		await renderAt("/forgot-password");

		send("ada@example.com");

		expect((await screen.findByRole("status")).textContent).toBe(SENT);
		expect(bodies).toEqual([{ email: "ada@example.com" }]);
		expect(screen.queryByLabelText("Email")).toBeNull();
	});

	it("shows the same message for an email with no account", async () => {
		fakeMe(() => false);
		accept();
		await renderAt("/forgot-password");

		send("nobody@example.com");

		expect((await screen.findByRole("status")).textContent).toBe(SENT);
	});

	it.each([
		["an empty email", ""],
		["a badly shaped email", "not-an-email"],
	])("stops %s before any request", async (_label, email) => {
		fakeMe(() => false);
		const bodies = accept();
		await renderAt("/forgot-password");

		send(email);

		expect(
			await screen.findByText("Enter a valid email address."),
		).toBeTruthy();
		expect(bodies).toEqual([]);
	});

	it("shows the server's 422 message under the email field", async () => {
		fakeMe(() => false);
		server.use(
			http.post(FORGOT, () =>
				HttpResponse.json(
					{
						message: "The email field must be a valid email address.",
						errors: {
							email: ["The email field must be a valid email address."],
						},
					},
					{ status: 422 },
				),
			),
		);
		await renderAt("/forgot-password");

		send("ada@example.com");

		const error = await screen.findByText(
			"The email field must be a valid email address.",
		);
		const email = screen.getByLabelText("Email");
		expect(email.getAttribute("aria-invalid")).toBe("true");
		expect(email.getAttribute("aria-describedby")).toBe(error.id);
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("shows a wait message on 429 and keeps the typed email", async () => {
		fakeMe(() => false);
		server.use(
			http.post(FORGOT, () =>
				HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
			),
		);
		await renderAt("/forgot-password");

		send("ada@example.com");

		expect((await screen.findByRole("alert")).textContent).toBe(
			"Too many tries. Wait a minute and try again.",
		);
		const email = screen.getByLabelText("Email") as HTMLInputElement;
		expect(email.value).toBe("ada@example.com");
		expect(screen.queryByRole("status")).toBeNull();
	});

	it("disables the button while the request is pending", async () => {
		fakeMe(() => false);
		let release = () => {};
		server.use(
			http.post(FORGOT, async () => {
				await new Promise<void>((resolve) => {
					release = resolve;
				});
				return new HttpResponse(null, { status: 202 });
			}),
		);
		await renderAt("/forgot-password");

		send("ada@example.com");

		const button = await screen.findByRole("button", { name: "Sending…" });
		expect((button as HTMLButtonElement).disabled).toBe(true);
		release();
		await waitFor(() => expect(screen.queryByText("Sending…")).toBeNull());
	});

	it("links back to log in, keeping redirect", async () => {
		fakeMe(() => false);
		await renderAt("/forgot-password?redirect=%2Fprofile");

		const link = screen.getByRole("link", { name: "Back to log in" });
		expect(link.getAttribute("href")).toBe("/login?redirect=%2Fprofile");
	});

	it("sends a signed-in user away", async () => {
		fakeMe(() => true);
		const { router } = await renderAt("/forgot-password");

		expect(router.state.location.pathname).toBe("/chats");
	});
});
