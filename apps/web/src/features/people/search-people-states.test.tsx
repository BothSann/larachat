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

const field = () => screen.findByLabelText<HTMLInputElement>("Find people");
const rowTexts = () =>
	screen.getAllByRole("listitem").map((row) => row.textContent);

describe("People on /chats", () => {
	it("without q, lists everyone and sends no search", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([bob, bobby]));

		await renderAt("/chats");

		expect(await screen.findByText("@bobby")).toBeTruthy();
		expect(rowTexts()).toEqual(["Bob@bob", "Bobby Tables@bobby"]);
		expect(searches).toEqual([null]);
		expect((await field()).value).toBe("");
	});

	it("without q and no one else, says so", async () => {
		fakeMeIs(verifiedAda);
		fakeUsers(() => page([]));

		await renderAt("/chats");

		expect(await screen.findByText("No one else is here yet.")).toBeTruthy();
	});

	it("fills the field from the URL and searches at once", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([bob, bobby]));

		await renderAt("/chats?q=bo");

		expect((await field()).value).toBe("bo");
		expect(await screen.findByText("@bob")).toBeTruthy();
		expect(rowTexts()).toEqual(["Bob@bob", "Bobby Tables@bobby"]);
		expect(searches).toEqual(["bo"]);
	});

	it("searches a number from the URL as text, and names it when empty", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([]));

		await renderAt("/chats?q=42");

		expect(
			await screen.findByText('No usernames start with "42".'),
		).toBeTruthy();
		expect(searches).toEqual(["42"]);
		expect((await field()).value).toBe("42");
	});

	it("asks for 2 characters and sends nothing for 1", async () => {
		fakeMeIs(verifiedAda);
		const searches = fakeUsers(() => page([]));

		await renderAt("/chats?q=b");

		expect(await screen.findByText("Type at least 2 characters.")).toBeTruthy();
		expect(searches).toEqual([]);
	});

	it("shows Loading people… on the first load", async () => {
		fakeMeIs(verifiedAda);
		fakeUsers(async () => {
			await delay(100);
			return page([bob]);
		});

		await renderAt("/chats");

		expect(await screen.findByText("Loading people…")).toBeTruthy();
		expect(await screen.findByText("@bob")).toBeTruthy();
		expect(screen.queryByText("Loading people…")).toBeNull();
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
		"%i on page 1: shows an alert and keeps the text",
		async (status, message, shown) => {
			fakeMeIs(verifiedAda);
			fakeUsers(() => HttpResponse.json({ message }, { status }));

			await renderAt("/chats?q=bo");

			expect((await screen.findByRole("alert")).textContent).toBe(shown);
			expect((await field()).value).toBe("bo");
			expect(screen.queryByRole("list")).toBeNull();
			expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
		},
	);

	it("unverified: no field and no request", async () => {
		fakeMeIs(ada);
		const searches = fakeUsers(() => page([bob]));

		await renderAt("/chats");

		expect(
			await screen.findByText("Verify your email to find people."),
		).toBeTruthy();
		expect(screen.queryByLabelText("Find people")).toBeNull();
		expect(searches).toEqual([]);
	});
});
