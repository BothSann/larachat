import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMeIs, fakeUsers, page, verifiedAda } from "#/test/people";
import { renderAt } from "#/test/render-at";

describe("q in the /chats URL", () => {
	it.each([
		["/chats?q=bo", "bo"],
		["/chats?q=%40Bo", "bo"],
		["/chats?q=42", "42"],
		["/chats?q=true", undefined],
		["/chats?q=null", undefined],
		["/chats", undefined],
	])("%s gives q = %j", async (url, q) => {
		fakeMeIs(verifiedAda);
		fakeUsers(() => page([]));

		const { router } = await renderAt(url);

		expect(await screen.findByText("Signed in as Ada")).toBeTruthy();
		expect((router.state.location.search as { q?: string }).q).toBe(q);
	});

	it("Dismiss removes only verified and keeps q", async () => {
		fakeMeIs(verifiedAda);
		fakeUsers(() => page([]));
		const { router } = await renderAt("/chats?verified=1&q=bo");

		const dismiss = await screen.findByRole("button", { name: "Dismiss" });
		const urls: string[] = [];
		router.history.subscribe(({ location }) => urls.push(location.href));

		fireEvent.click(dismiss);

		await waitFor(() => expect(router.state.location.href).toBe("/chats?q=bo"));
		expect(urls).toEqual(["/chats?q=bo"]);
	});
});
