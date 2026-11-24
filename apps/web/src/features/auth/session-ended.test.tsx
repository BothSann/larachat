import { RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { meQuery } from "#/features/auth/queries";
import { getRouter } from "#/router";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";

const NOTE = "Your session ended. Log in again.";

beforeEach(() => {
	setCookie("XSRF-TOKEN", "test-token");
	// getRouter() turns on scroll restoration; jsdom has no scrollTo.
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
	clearCookie("XSRF-TOKEN");
	vi.useRealTimers();
	vi.restoreAllMocks();
});

// The real app router from src/router.tsx, so the real QueryCache and
// MutationCache handlers run. It reads the URL from jsdom's window.
async function renderApp(url: string) {
	window.history.replaceState(null, "", url);
	const router = getRouter();
	render(<RouterProvider router={router} />);
	await router.load();
	return { router, queryClient: router.options.context.queryClient };
}

// GET /me answers as Ada while `session.on` is true, then 401.
function fakeSession() {
	const session = { on: true, meCalls: 0 };
	server.use(
		http.get(`${API}/me`, () => {
			session.meCalls++;
			return session.on
				? HttpResponse.json({ data: ada })
				: HttpResponse.json({ message: "Unauthenticated." }, { status: 401 });
		}),
		http.patch(`${API}/me`, () =>
			session.on
				? HttpResponse.json({ data: ada })
				: HttpResponse.json({ message: "Unauthenticated." }, { status: 401 }),
		),
	);
	return session;
}

describe("session ended in another tab", () => {
	it("a 401 on the me refetch goes to /login?redirect=/profile&ended=1", async () => {
		const session = fakeSession();
		const { router, queryClient } = await renderApp("/profile");
		await screen.findByRole("heading", { name: "Profile" });

		session.on = false;
		await queryClient.refetchQueries({ queryKey: ["me"] });

		await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
		expect(router.state.location.search).toEqual({
			redirect: "/profile",
			ended: 1,
		});
		expect((await screen.findByRole("status")).textContent).toContain(NOTE);
		expect(queryClient.getQueryData(["me"])).toBeUndefined();
	});

	it("a 401 on the profile form submit goes to /login with the note", async () => {
		const session = fakeSession();
		const { router } = await renderApp("/profile");
		fireEvent.change(await screen.findByLabelText("Name"), {
			target: { value: "Ada B" },
		});

		session.on = false;
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
		expect(router.state.location.search).toEqual({
			redirect: "/profile",
			ended: 1,
		});
		expect((await screen.findByRole("status")).textContent).toContain(NOTE);
		expect(screen.queryByText("Unauthenticated.")).toBeNull();
	});

	it("navigating with a fresh me sends no request", async () => {
		const session = fakeSession();
		const { router } = await renderApp("/profile");
		await screen.findByRole("heading", { name: "Profile" });
		const before = session.meCalls;

		await router.navigate({ to: "/chats" });

		expect(router.state.location.pathname).toBe("/chats");
		expect(session.meCalls).toBe(before);
	});

	it("navigating with a stale me refetches it, and a 401 logs the tab out", async () => {
		vi.useFakeTimers({ toFake: ["Date"] });
		const session = fakeSession();
		const { router } = await renderApp("/profile");
		await screen.findByRole("heading", { name: "Profile" });
		const before = session.meCalls;

		session.on = false;
		vi.setSystemTime(Date.now() + 31_000);
		await router.navigate({ to: "/chats" });

		await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
		expect(session.meCalls).toBeGreaterThan(before);
		expect(router.state.location.search).toEqual({
			redirect: "/chats",
			ended: 1,
		});
	});

	it("a 500 on the me refetch does not log the tab out", async () => {
		fakeSession();
		const { router, queryClient } = await renderApp("/profile");
		await screen.findByRole("heading", { name: "Profile" });
		server.use(
			http.get(`${API}/me`, () =>
				HttpResponse.json({ message: "Server Error" }, { status: 500 }),
			),
		);
		// The app retries a 5xx 3 times with a delay; skip that here.
		await expect(
			queryClient.fetchQuery({ ...meQuery, staleTime: 0, retry: false }),
		).rejects.toThrow("Server Error");

		expect(router.state.location.pathname).toBe("/profile");
		expect(queryClient.getQueryData(["me"])).toEqual(ada);
	});

	it("a 422 on the profile form stays on /profile", async () => {
		fakeSession();
		server.use(
			http.patch(`${API}/me`, () =>
				HttpResponse.json(
					{
						message: "The username has already been taken.",
						errors: { username: ["The username has already been taken."] },
					},
					{ status: 422 },
				),
			),
		);
		const { router } = await renderApp("/profile");
		fireEvent.change(await screen.findByLabelText("Username"), {
			target: { value: "bob" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText("The username has already been taken."),
		).toBeTruthy();
		expect(router.state.location.pathname).toBe("/profile");
	});
});

describe("guests and first loads are unchanged", () => {
	it("a guest on /login sends one GET /me and sees no note", async () => {
		const session = fakeSession();
		session.on = false;

		const { router } = await renderApp("/login");

		expect(await screen.findByRole("heading", { name: "Log in" })).toBeTruthy();
		expect(router.state.location.pathname).toBe("/login");
		expect(session.meCalls).toBe(1);
		expect(screen.queryByText(NOTE)).toBeNull();
	});

	it("logged out, /profile goes to /login?redirect=/profile with no note", async () => {
		const session = fakeSession();
		session.on = false;

		const { router } = await renderApp("/profile");

		await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
		expect(router.state.location.search).toEqual({ redirect: "/profile" });
		expect(screen.queryByText(NOTE)).toBeNull();
	});
});
