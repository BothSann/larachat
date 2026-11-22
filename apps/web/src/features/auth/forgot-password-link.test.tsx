import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fakeMe, renderAt } from "#/test/render-at";

describe("forgot password link on /login", () => {
	it("goes to /forgot-password", async () => {
		fakeMe(() => false);
		const { router } = await renderAt("/login");

		fireEvent.click(screen.getByRole("link", { name: "Forgot password?" }));

		expect(
			await screen.findByRole("heading", { name: "Forgot password" }),
		).toBeTruthy();
		expect(router.state.location.pathname).toBe("/forgot-password");
	});

	it("keeps the redirect search param", async () => {
		fakeMe(() => false);
		await renderAt("/login?redirect=%2Fprofile");

		const link = screen.getByRole("link", { name: "Forgot password?" });
		expect(link.getAttribute("href")).toBe(
			"/forgot-password?redirect=%2Fprofile",
		);
	});
});
