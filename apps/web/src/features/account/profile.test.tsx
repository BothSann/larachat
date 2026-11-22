import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

// A tiny fake Laravel: GET /me returns `current`, PATCH /me changes it.
function fakeAccount() {
	let current = { ...ada };
	server.use(
		http.get(`${API}/me`, () => HttpResponse.json({ data: current })),
		http.patch(`${API}/me`, async ({ request }) => {
			const body = (await request.json()) as { name: string; username: string };
			current = { ...current, ...body };
			return HttpResponse.json({ data: current });
		}),
	);
}

describe("/profile page", () => {
	it("shows the form under the _app layout, with the verify banner", async () => {
		fakeAccount();

		await renderAt("/profile");

		expect(
			await screen.findByRole("heading", { name: "Profile" }),
		).toBeTruthy();
		expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
			"Ada",
		);
		expect(
			screen.getByText("Check your email to verify your account."),
		).toBeTruthy();
	});

	it("signed out: goes to /login?redirect=/profile", async () => {
		server.use(
			http.get(`${API}/me`, () =>
				HttpResponse.json({ message: "Unauthenticated." }, { status: 401 }),
			),
		);

		const { router } = await renderAt("/profile");

		await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
		expect(router.state.location.search).toEqual({ redirect: "/profile" });
	});
});

describe("links between /chats and /profile", () => {
	it("/chats links to /profile", async () => {
		fakeAccount();
		const { router } = await renderAt("/chats");

		fireEvent.click(await screen.findByRole("link", { name: "Profile" }));

		await waitFor(() =>
			expect(router.state.location.pathname).toBe("/profile"),
		);
	});

	it("after a save, Back to chats shows the new name", async () => {
		fakeAccount();
		const { router } = await renderAt("/profile");

		fireEvent.change(await screen.findByLabelText("Name"), {
			target: { value: "Ada B" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await screen.findByText("Saved.");
		fireEvent.click(screen.getByRole("link", { name: "Back to chats" }));

		await waitFor(() => expect(router.state.location.pathname).toBe("/chats"));
		expect(await screen.findByText("Signed in as Ada B")).toBeTruthy();
	});
});
