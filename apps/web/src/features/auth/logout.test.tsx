import { fireEvent, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, fakeMe, renderAt } from "#/test/render-at";
import { server } from "#/test/server";

const LOGOUT = `${API}/auth/logout`;

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

describe("logout", () => {
	it.each([
		[204, "ends the session"],
		[401, "treats an expired session as logged out"],
	])("on %i, %s: clears the cache and goes to /login", async (status) => {
		let signedIn = true;
		fakeMe(() => signedIn);
		let posts = 0;
		server.use(
			http.post(LOGOUT, () => {
				posts++;
				signedIn = false;
				return status === 204
					? new HttpResponse(null, { status: 204 })
					: HttpResponse.json({ message: "Unauthenticated." }, { status });
			}),
		);
		const { router, queryClient } = await renderAt("/chats");
		await screen.findByText("Signed in as Ada");

		fireEvent.click(screen.getByRole("button", { name: "Log out" }));

		expect(await screen.findByText("Log in")).toBeTruthy();
		expect(router.state.location.pathname).toBe("/login");
		expect(posts).toBe(1);
		expect(queryClient.getQueryData(["me"])).toBeUndefined();
	});
});
