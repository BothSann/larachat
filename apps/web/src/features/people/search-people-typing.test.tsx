import { RouterProvider } from "@tanstack/react-router";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { delay, HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRouter } from "#/router";
import {
	bob,
	bobby,
	fakeMeIs,
	fakeUsers,
	page,
	verifiedAda,
} from "#/test/people";
import { API, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

const EMPTY = "No one else is here yet.";

beforeEach(() => {
	// getRouter() turns on scroll restoration; jsdom has no scrollTo.
	vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

function type(value: string) {
	fireEvent.change(screen.getByLabelText("Find people"), { target: { value } });
}

const field = () => screen.findByLabelText<HTMLInputElement>("Find people");

describe("typing in the search field", () => {
	it("waits for a 300 ms pause, then searches once for the last text", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers((search) => page(search ? [bob] : []));
		const { router } = await renderAt("/chats");
		expect(await screen.findByText(EMPTY)).toBeTruthy();

		vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
		type("b");
		act(() => void vi.advanceTimersByTime(200));
		type("bo");
		act(() => void vi.advanceTimersByTime(200));
		type("bob");
		act(() => void vi.advanceTimersByTime(299));
		expect(router.state.location.href).toBe("/chats");
		expect(searches).toEqual([null]);
		act(() => void vi.advanceTimersByTime(1));
		vi.useRealTimers();

		expect(await screen.findByText("@bob")).toBeTruthy();
		expect(router.state.location.href).toBe("/chats?q=bob");
		expect(searches).toEqual([null, "bob"]);
	});

	it("cleans the text for the URL but not in the field", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers((search) => page(search ? [bob] : []));
		const { router } = await renderAt("/chats");
		expect(await screen.findByText(EMPTY)).toBeTruthy();

		type("@Bo");

		expect(await screen.findByText("@bob")).toBeTruthy();
		expect(router.state.location.href).toBe("/chats?q=bo");
		expect((await field()).value).toBe("@Bo");
		expect(searches).toEqual([null, "bo"]);
	});

	it("keeps digits as text in the URL", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([]));
		const { router } = await renderAt("/chats");
		expect(await screen.findByText(EMPTY)).toBeTruthy();

		type("42");

		expect(
			await screen.findByText('No usernames start with "42".'),
		).toBeTruthy();
		expect(router.state.location.href).toBe("/chats?q=%2242%22");
		expect(searches).toEqual([null, "42"]);
	});

	it("adds no history entry", async () => {
		fakeMeIs(verifiedAda);
		fakeUsers(() => page([bob]));
		const { router } = await renderAt("/chats");
		await field();
		const before = router.history.length;

		type("bo");
		await waitFor(() => expect(router.state.location.href).toBe("/chats?q=bo"));

		expect(router.history.length).toBe(before);
	});

	it("clearing the field removes q and lists everyone", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers((search) => page(search ? [bob] : [bobby]));
		const { router } = await renderAt("/chats?q=bo");
		expect(await screen.findByText("@bob")).toBeTruthy();

		type("");

		expect(await screen.findByText("@bobby")).toBeTruthy();
		expect(router.state.location.href).toBe("/chats");
		expect(screen.queryByText("@bob")).toBeNull();
		expect(searches).toEqual(["bo", null]);
	});

	it("keeps verified in the URL while typing", async () => {
		fakeMeIs(verifiedAda);
		fakeUsers(() => page([bob]));
		const { router } = await renderAt("/chats?verified=1");
		await field();

		type("bo");

		await waitFor(() =>
			expect(router.state.location.search).toEqual({ verified: 1, q: "bo" }),
		);
	});

	it("keeps the old rows while the next search loads, and drops them on an error", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(async (search) => {
			if (search === "bo") return page([bob, bobby]);
			await delay(100);
			return HttpResponse.json(
				{ message: "Too Many Attempts." },
				{ status: 429 },
			);
		});
		await renderAt("/chats?q=bo");
		expect(await screen.findByText("@bobby")).toBeTruthy();

		type("bob");
		await waitFor(() => expect(searches).toEqual(["bo", "bob"]));
		expect(screen.getByText("@bobby")).toBeTruthy();
		expect(screen.queryByText("Loading people…")).toBeNull();

		expect(await screen.findByRole("alert")).toBeTruthy();
		expect(screen.queryByText("@bobby")).toBeNull();
	});
});

// The real router from src/router.tsx: real retry rule, real 401 handler.
describe("with the real app router", () => {
	async function renderApp(url: string) {
		window.history.replaceState(null, "", url);
		const router = getRouter();
		render(<RouterProvider router={router} />);
		await router.load();
		return { router, queryClient: router.options.context.queryClient };
	}

	it.each([[422], [429], [403]])("never retries a %i", async (status) => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() =>
			HttpResponse.json({ message: "No." }, { status }),
		);
		const { queryClient } = await renderApp("/chats?q=bo");

		expect(await screen.findByRole("alert")).toBeTruthy();

		const state = queryClient.getQueryState(["people", "list", "bo"]);
		expect(state?.fetchStatus).toBe("idle");
		expect(searches).toHaveLength(1);
	});

	it("a 401 from the search goes to /login with the note", async () => {
		let signedIn = true;
		server.use(
			http.get(`${API}/me`, () =>
				signedIn
					? HttpResponse.json({ data: verifiedAda })
					: HttpResponse.json({ message: "Unauthenticated." }, { status: 401 }),
			),
		);
		fakeUsers(() => {
			signedIn = false;
			return HttpResponse.json(
				{ message: "Unauthenticated." },
				{ status: 401 },
			);
		});
		const { router } = await renderApp("/chats?q=bo");

		expect(await screen.findByRole("heading", { name: "Log in" })).toBeTruthy();
		expect(router.state.location.pathname).toBe("/login");
		expect(router.state.location.search).toEqual({
			redirect: "/chats?q=bo",
			ended: 1,
		});
	});
});
