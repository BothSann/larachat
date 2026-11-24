import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMe, renderAt } from "#/test/render-at";

const NOTE = "Your session ended. Log in again.";

describe("session ended note on /login", () => {
	it("shows the note on /login?ended=1", async () => {
		fakeMe(() => false);
		await renderAt("/login?ended=1");

		expect(screen.getByRole("status").textContent).toContain(NOTE);
	});

	it("removes ended from the URL on Dismiss and keeps redirect", async () => {
		fakeMe(() => false);
		const { router } = await renderAt("/login?ended=1&redirect=%2Fprofile");

		fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

		await waitFor(() => expect(screen.queryByText(NOTE)).toBeNull());
		expect(router.state.location.pathname).toBe("/login");
		expect(router.state.location.search).toEqual({ redirect: "/profile" });
	});

	it.each(["/login", "/login?ended=yes", "/login?ended=2"])(
		"shows no note on %s",
		async (url) => {
			fakeMe(() => false);
			await renderAt(url);

			expect(screen.getByRole("heading", { name: "Log in" })).toBeTruthy();
			expect(screen.queryByText(NOTE)).toBeNull();
		},
	);
});
