import { screen } from "@testing-library/react";
import { delay, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import {
	bob,
	bobby,
	fakeMeIs,
	fakeUsers,
	page,
	verifiedAda,
} from "#/test/people";
import { ada, renderAt } from "#/test/render-at";

const HINT = "Search for a username to find people.";
const field = () => screen.findByLabelText<HTMLInputElement>("Find people");

describe("search on /chats", () => {
	it("fills the field from the URL and searches at once", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([bob, bobby]));

		await renderAt("/chats?q=bo");

		expect((await field()).value).toBe("bo");
		expect(await screen.findByText("@bob")).toBeTruthy();
		const rows = screen.getAllByRole("listitem").map((r) => r.textContent);
		expect(rows).toEqual(["Bob@bob", "Bobby Tables@bobby"]);
		expect(searches).toEqual(["bo"]);
	});

	it("searches a number from the URL as text", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([]));

		await renderAt("/chats?q=42");

		expect(await screen.findByText("No one found.")).toBeTruthy();
		expect(searches).toEqual(["42"]);
		expect((await field()).value).toBe("42");
	});

	it("shows the hint and sends nothing without q", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([]));

		await renderAt("/chats");

		expect(await screen.findByText(HINT)).toBeTruthy();
		expect(searches).toEqual([]);
	});

	it("asks for 2 characters and sends nothing for 1", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([]));

		await renderAt("/chats?q=b");

		expect(await screen.findByText("Type at least 2 characters.")).toBeTruthy();
		expect(searches).toEqual([]);
	});

	it("shows Searching… on the first load", async () => {
		fakeMeIs(verifiedAda);
		fakeUsers(async () => {
			await delay(100);
			return page([bob]);
		});

		await renderAt("/chats?q=bo");

		expect(await screen.findByText("Searching…")).toBeTruthy();
		expect(await screen.findByText("@bob")).toBeTruthy();
		expect(screen.queryByText("Searching…")).toBeNull();
	});

	it("says when there are more than one page", async () => {
		fakeMeIs(verifiedAda);
		fakeUsers(() => page([bob], "abc"));

		await renderAt("/chats?q=bo");

		expect(
			await screen.findByText("Keep typing to narrow the list."),
		).toBeTruthy();
	});

	it("422: shows the API's message under the field", async () => {
		const message =
			"The search must be 2 to 30 letters, numbers, or underscores.";
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() =>
			HttpResponse.json(
				{ message, errors: { search: [message] } },
				{ status: 422 },
			),
		);

		await renderAt("/chats?q=b-b");

		const error = await screen.findByText(message);
		const input = await field();
		expect(input.value).toBe("b-b");
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(input.getAttribute("aria-describedby")).toBe(error.id);
		expect(screen.queryByRole("alert")).toBeNull();
		expect(searches).toHaveLength(1);
	});

	it.each([
		[
			429,
			"Too Many Attempts.",
			"Too many searches. Wait a minute, then try again.",
		],
		[
			403,
			"Your email address is not verified.",
			"Your email address is not verified.",
		],
		[500, "Server Error", "Server Error"],
	])(
		"%i: shows an alert and keeps the text",
		async (status, message, shown) => {
			fakeMeIs(verifiedAda);
			fakeUsers(() => HttpResponse.json({ message }, { status }));

			await renderAt("/chats?q=bo");

			expect((await screen.findByRole("alert")).textContent).toBe(shown);
			expect((await field()).value).toBe("bo");
			expect(screen.queryByRole("list")).toBeNull();
		},
	);

	it("unverified: no field and no request", async () => {
		fakeMeIs(ada);
		const searches = fakeUsers(() => page([bob]));

		await renderAt("/chats?q=bo");

		expect(
			await screen.findByText("Verify your email to find people."),
		).toBeTruthy();
		expect(screen.queryByLabelText("Find people")).toBeNull();
		expect(searches).toEqual([]);
	});
});
