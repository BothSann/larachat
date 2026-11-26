import { fireEvent, screen, waitFor } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
	bob,
	bobby,
	fakeMeIs,
	fakeUserRequests,
	page,
	verifiedAda,
} from "#/test/people";
import { renderAt } from "#/test/render-at";

const carol = {
	id: "01jd0000000000000000000003",
	name: "Carol",
	username: "carol",
};

const loadMore = () => screen.findByRole("button", { name: "Load more" });
const rowTexts = () =>
	screen.getAllByRole("listitem").map((row) => row.textContent);
function type(value: string) {
	fireEvent.change(screen.getByLabelText("Find people"), { target: { value } });
}

// Everyone: page 1 is [bob] then c2, page 2 is [carol] and the end.
// A search for "bo" is [bob, bobby] on one page.
function fakeTwoPages(onPage2?: () => Promise<Response> | Response) {
	return fakeUserRequests((params) => {
		if (params.get("search") === "bo") return page([bob, bobby]);
		if (params.get("cursor") === "c2") return onPage2?.() ?? page([carol]);
		return page([bob], "c2");
	});
}

describe("Load more on /chats", () => {
	it("shows Load more only when there is a next cursor", async () => {
		fakeMeIs(verifiedAda);
		fakeTwoPages();
		await renderAt("/chats");

		expect(await loadMore()).toBeTruthy();
	});

	it("hides Load more on the last page", async () => {
		fakeMeIs(verifiedAda);
		fakeUserRequests(() => page([bob]));
		await renderAt("/chats");

		expect(await screen.findByText("@bob")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
	});

	it("sends next_cursor as cursor and adds page 2 below page 1", async () => {
		fakeMeIs(verifiedAda);
		const requests = fakeTwoPages();
		await renderAt("/chats");

		fireEvent.click(await loadMore());

		expect(await screen.findByText("@carol")).toBeTruthy();
		expect(rowTexts()).toEqual(["Bob@bob", "Carol@carol"]);
		expect(requests).toEqual(["", "cursor=c2"]);
		expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
	});

	it("while page 2 loads: Loading…, disabled, and a second click sends nothing", async () => {
		fakeMeIs(verifiedAda);
		const requests = fakeTwoPages(async () => {
			await delay(100);
			return page([carol]);
		});
		await renderAt("/chats");

		const button = await loadMore();
		fireEvent.click(button);

		const busy = await screen.findByRole("button", { name: "Loading…" });
		expect(busy.hasAttribute("disabled")).toBe(true);
		fireEvent.click(busy);

		expect(await screen.findByText("@carol")).toBeTruthy();
		expect(requests).toEqual(["", "cursor=c2"]);
	});

	it("a failed page 2 keeps page 1, shows the error by the button, and retries", async () => {
		fakeMeIs(verifiedAda);
		let fail = true;
		const requests = fakeTwoPages(() =>
			fail
				? HttpResponse.json({ message: "Server Error" }, { status: 500 })
				: page([carol]),
		);
		await renderAt("/chats");

		fireEvent.click(await loadMore());

		expect((await screen.findByRole("alert")).textContent).toBe("Server Error");
		expect(rowTexts()).toEqual(["Bob@bob"]);

		fail = false;
		fireEvent.click(await loadMore());

		expect(await screen.findByText("@carol")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
		expect(requests).toEqual(["", "cursor=c2", "cursor=c2"]);
	});

	it("a search replaces the list; clearing it starts everyone again at page 1", async () => {
		fakeMeIs(verifiedAda);
		const requests = fakeTwoPages();
		const { queryClient } = await renderAt("/chats");
		fireEvent.click(await loadMore());
		expect(await screen.findByText("@carol")).toBeTruthy();

		type("bo");
		expect(await screen.findByText("@bobby")).toBeTruthy();
		expect(rowTexts()).toEqual(["Bob@bob", "Bobby Tables@bobby"]);
		expect(queryClient.getQueryData(["people", "list", ""])).toBeUndefined();

		type("");
		expect(await loadMore()).toBeTruthy();
		await waitFor(() => expect(rowTexts()).toEqual(["Bob@bob"]));

		expect(requests).toEqual(["", "cursor=c2", "search=bo", ""]);
	});

	it("keeps the old list on screen, faded, until the new page 1 arrives", async () => {
		fakeMeIs(verifiedAda);
		fakeUserRequests(async (params) => {
			if (params.get("search") === "bo") {
				await delay(100);
				return page([bob, bobby]);
			}
			return page([carol]);
		});
		await renderAt("/chats");
		expect(await screen.findByText("@carol")).toBeTruthy();

		type("bo");

		await waitFor(() =>
			expect(screen.getByRole("list").parentElement?.className).toContain(
				"opacity-60",
			),
		);
		expect(screen.getByText("@carol")).toBeTruthy();
		expect(screen.queryByText("Loading people…")).toBeNull();

		expect(await screen.findByText("@bobby")).toBeTruthy();
		expect(screen.queryByText("@carol")).toBeNull();
	});
});
