import { fireEvent, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

describe("/profile: change password section", () => {
	it("sits under the profile form, with its own heading and button", async () => {
		server.use(http.get(`${API}/me`, () => HttpResponse.json({ data: ada })));

		await renderAt("/profile");

		expect(
			await screen.findByRole("heading", { name: "Change password" }),
		).toBeTruthy();
		expect(screen.getByLabelText("Current password")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Change password" }),
		).toBeTruthy();
		expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
	});

	it("after a change: stays on /profile and the profile form keeps its values", async () => {
		server.use(
			http.get(`${API}/me`, () => HttpResponse.json({ data: ada })),
			http.put(
				`${API}/me/password`,
				() => new HttpResponse(null, { status: 204 }),
			),
		);
		const { router } = await renderAt("/profile");

		fireEvent.change(await screen.findByLabelText("Current password"), {
			target: { value: "old-secret-password" },
		});
		fireEvent.change(screen.getByLabelText("New password"), {
			target: { value: "new-secret-password" },
		});
		fireEvent.change(screen.getByLabelText("Confirm new password"), {
			target: { value: "new-secret-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Change password" }));

		expect(await screen.findByText("Password changed.")).toBeTruthy();
		expect(router.state.location.pathname).toBe("/profile");
		expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
			"Ada",
		);
	});
});
