import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API } from "#/test/render-at";
import { server } from "#/test/server";
import { ChangePasswordForm } from "./change-password-form";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function renderForm() {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false } },
	});
	render(
		<QueryClientProvider client={queryClient}>
			<ChangePasswordForm />
		</QueryClientProvider>,
	);
}

// Fakes PUT /me/password. `reply` decides the answer. Returns the bodies sent.
function fakePut(reply: () => Response | Promise<Response>) {
	const bodies: unknown[] = [];
	server.use(
		http.put(`${API}/me/password`, async ({ request }) => {
			bodies.push(await request.json());
			return reply();
		}),
	);
	return bodies;
}

const noContent = () => new HttpResponse(null, { status: 204 });

const input = (label: string) =>
	screen.getByLabelText(label) as HTMLInputElement;

function type(label: string, value: string) {
	fireEvent.change(input(label), { target: { value } });
}

function fillAndSubmit(
	current = "old-secret-password",
	next = "new-secret-password",
	confirm = next,
) {
	type("Current password", current);
	type("New password", next);
	type("Confirm new password", confirm);
	fireEvent.click(screen.getByRole("button", { name: "Change password" }));
}

describe("the fields", () => {
	it("are password inputs with the right autocomplete hints", () => {
		renderForm();

		expect(input("Current password").type).toBe("password");
		expect(input("Current password").autocomplete).toBe("current-password");
		expect(input("New password").autocomplete).toBe("new-password");
		expect(input("Confirm new password").autocomplete).toBe("new-password");
	});
});

describe("submit", () => {
	it("sends one PUT with the three fields", async () => {
		const bodies = fakePut(noContent);
		renderForm();

		fillAndSubmit();

		await screen.findByRole("status");
		expect(bodies).toEqual([
			{
				current_password: "old-secret-password",
				password: "new-secret-password",
				password_confirmation: "new-secret-password",
			},
		]);
	});

	it("on 204: clears all three fields and shows Password changed.", async () => {
		fakePut(noContent);
		renderForm();

		fillAndSubmit();

		expect((await screen.findByRole("status")).textContent).toBe(
			"Password changed.",
		);
		expect(input("Current password").value).toBe("");
		expect(input("New password").value).toBe("");
		expect(input("Confirm new password").value).toBe("");
	});

	it("disables the button while the request is on its way", async () => {
		let release: () => void = () => {};
		fakePut(async () => {
			await new Promise<void>((resolve) => {
				release = resolve;
			});
			return noContent();
		});
		renderForm();

		fillAndSubmit();

		const button = await screen.findByRole("button", { name: "Saving…" });
		expect((button as HTMLButtonElement).disabled).toBe(true);
		release();
		await screen.findByRole("status");
	});
});

describe("checks before sending", () => {
	it("empty current password: asks for it, sends nothing", async () => {
		const bodies = fakePut(noContent);
		renderForm();

		fillAndSubmit("");

		expect(
			await screen.findByText("Enter your current password."),
		).toBeTruthy();
		expect(bodies).toEqual([]);
	});

	it("short new password: Use at least 8 characters., sends nothing", async () => {
		const bodies = fakePut(noContent);
		renderForm();

		fillAndSubmit("old-secret-password", "1234567");

		expect(await screen.findByText("Use at least 8 characters.")).toBeTruthy();
		expect(bodies).toEqual([]);
	});

	it("confirmation differs: Passwords don't match., sends nothing", async () => {
		const bodies = fakePut(noContent);
		renderForm();

		fillAndSubmit("old-secret-password", "new-secret-password", "other-one");

		expect(await screen.findByText("Passwords don't match.")).toBeTruthy();
		expect(bodies).toEqual([]);
	});
});

describe("server refusals", () => {
	it("422 current_password: shows under Current password, keeps the values", async () => {
		fakePut(() =>
			HttpResponse.json(
				{
					message: "The password is incorrect.",
					errors: { current_password: ["The password is incorrect."] },
				},
				{ status: 422 },
			),
		);
		renderForm();

		fillAndSubmit("wrong-password");

		expect(await screen.findByText("The password is incorrect.")).toBeTruthy();
		expect(input("Current password").value).toBe("wrong-password");
		expect(input("New password").value).toBe("new-secret-password");
		expect(screen.queryByRole("alert")).toBeNull();
		expect(screen.queryByRole("status")).toBeNull();
	});

	it("422 password: shows under New password", async () => {
		const message =
			"The password field and current password must be different.";
		fakePut(() =>
			HttpResponse.json(
				{ message, errors: { password: [message] } },
				{ status: 422 },
			),
		);
		renderForm();

		fillAndSubmit("same-secret-password", "same-secret-password");

		expect(await screen.findByText(message)).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("429: the fixed message in role=alert, values stay", async () => {
		fakePut(() =>
			HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
		);
		renderForm();

		fillAndSubmit();

		expect((await screen.findByRole("alert")).textContent).toBe(
			"Too many tries. Wait a minute and try again.",
		);
		expect(input("Current password").value).toBe("old-secret-password");
	});

	it("other error: the server's message in role=alert", async () => {
		fakePut(() =>
			HttpResponse.json({ message: "Server Error" }, { status: 500 }),
		);
		renderForm();

		fillAndSubmit();

		expect((await screen.findByRole("alert")).textContent).toBe("Server Error");
	});

	it("a success after an error hides the error", async () => {
		let attempt = 0;
		fakePut(() => {
			attempt += 1;
			return attempt === 1
				? HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 })
				: noContent();
		});
		renderForm();

		fillAndSubmit();
		await screen.findByRole("alert");
		fireEvent.click(screen.getByRole("button", { name: "Change password" }));

		await screen.findByRole("status");
		await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
	});
});
