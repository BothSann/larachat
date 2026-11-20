import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada, fakeMe, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

const REGISTER = `${API}/auth/register`;

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

type Form = {
	name: string;
	username: string;
	email: string;
	password: string;
	confirm: string;
};

const valid: Form = {
	name: "Ada",
	username: "ada",
	email: "ada@example.com",
	password: "secret123",
	confirm: "secret123",
};

function fillIn(form: Form) {
	const type = (label: string, value: string) =>
		fireEvent.change(screen.getByLabelText(label), { target: { value } });
	type("Name", form.name);
	type("Username", form.username);
	type("Email", form.email);
	type("Password", form.password);
	type("Confirm password", form.confirm);
	fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

function countPosts(reply: () => Response) {
	let posts = 0;
	server.use(
		http.post(REGISTER, () => {
			posts++;
			return reply();
		}),
	);
	return () => posts;
}

function reply422(field: string, message: string) {
	return () =>
		HttpResponse.json(
			{ message, errors: { [field]: [message] } },
			{ status: 422 },
		);
}

describe("register form", () => {
	it("signs up, goes to the redirect, and skips a second GET /me", async () => {
		let signedIn = false;
		const meCalls = fakeMe(() => signedIn);
		server.use(
			http.post(REGISTER, () => {
				signedIn = true;
				return HttpResponse.json({ data: ada }, { status: 201 });
			}),
		);
		const { router } = await renderAt("/register?redirect=%2Fchats");
		const callsBefore = meCalls();

		fillIn(valid);

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect(router.state.location.pathname).toBe("/chats");
		expect(meCalls()).toBe(callsBefore);
	});

	it("stops a password mismatch before any request, under the confirm field", async () => {
		fakeMe(() => false);
		const posts = countPosts(() =>
			HttpResponse.json({ data: ada }, { status: 201 }),
		);
		await renderAt("/register");

		fillIn({ ...valid, confirm: "secret124" });

		const error = await screen.findByText("Passwords don't match.");
		const confirm = screen.getByLabelText("Confirm password");
		expect(confirm.getAttribute("aria-describedby")).toBe(error.id);
		expect(
			screen.getByLabelText("Password").getAttribute("aria-invalid"),
		).toBeNull();
		expect(posts()).toBe(0);
	});

	it("asks for empty fields before any request", async () => {
		fakeMe(() => false);
		const posts = countPosts(() =>
			HttpResponse.json({ data: ada }, { status: 201 }),
		);
		await renderAt("/register");

		fillIn({ name: "", username: "", email: "", password: "", confirm: "" });

		expect(await screen.findByText("Enter your name.")).toBeTruthy();
		expect(screen.getByText("Choose a username.")).toBeTruthy();
		expect(posts()).toBe(0);
	});

	it("shows a taken username from the 422 under the username field", async () => {
		fakeMe(() => false);
		countPosts(reply422("username", "The username has already been taken."));
		await renderAt("/register");

		fillIn(valid);

		const error = await screen.findByText(
			"The username has already been taken.",
		);
		const username = screen.getByLabelText("Username");
		expect(username.getAttribute("aria-invalid")).toBe("true");
		expect(username.getAttribute("aria-describedby")).toBe(error.id);
	});

	it("leaves the username pattern to Laravel's 422", async () => {
		fakeMe(() => false);
		const posts = countPosts(
			reply422("username", "The username field format is invalid."),
		);
		await renderAt("/register");

		fillIn({ ...valid, username: "bad name!" });

		expect(
			await screen.findByText("The username field format is invalid."),
		).toBeTruthy();
		expect(posts()).toBe(1);
	});

	it("shows a server error above the form", async () => {
		fakeMe(() => false);
		countPosts(() =>
			HttpResponse.json({ message: "Server Error" }, { status: 500 }),
		);
		await renderAt("/register");

		fillIn(valid);

		expect((await screen.findByRole("alert")).textContent).toBe("Server Error");
	});

	it("disables the button while the request is pending", async () => {
		fakeMe(() => false);
		let release = () => {};
		server.use(
			http.post(REGISTER, async () => {
				await new Promise<void>((resolve) => {
					release = resolve;
				});
				return HttpResponse.json({ data: ada }, { status: 201 });
			}),
		);
		await renderAt("/register");

		fillIn(valid);

		const button = await screen.findByRole("button", {
			name: "Creating account…",
		});
		expect((button as HTMLButtonElement).disabled).toBe(true);
		release();
		await waitFor(() =>
			expect(screen.queryByText("Creating account…")).toBeNull(),
		);
	});
});

describe("links between login and register", () => {
	it("login links to register and keeps the redirect", async () => {
		fakeMe(() => false);
		await renderAt("/login?redirect=%2Fchats");

		const link = screen.getByRole("link", { name: "Sign up" });
		expect(link.getAttribute("href")).toBe("/register?redirect=%2Fchats");
	});

	it("register links to login and keeps the redirect", async () => {
		fakeMe(() => false);
		await renderAt("/register?redirect=%2Fchats");

		const link = screen.getByRole("link", { name: "Log in" });
		expect(link.getAttribute("href")).toBe("/login?redirect=%2Fchats");
	});

	it("adds no redirect when there was none", async () => {
		fakeMe(() => false);
		await renderAt("/login");

		const link = screen.getByRole("link", { name: "Sign up" });
		expect(link.getAttribute("href")).toBe("/register");
	});
});
