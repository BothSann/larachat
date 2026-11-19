import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { server } from "#/test/server";
import { api } from "./api-client";

describe("api client CSRF", () => {
	afterEach(() => clearCookie("XSRF-TOKEN"));

	it("sends X-XSRF-TOKEN, URL-decoded from the XSRF-TOKEN cookie", async () => {
		setCookie("XSRF-TOKEN", "abc%3D%3D");
		let header: string | null = null;
		server.use(
			http.post("http://api.test/api/v1/auth/logout", ({ request }) => {
				header = request.headers.get("X-XSRF-TOKEN");
				return new HttpResponse(null, { status: 204 });
			}),
		);

		await api.POST("/api/v1/auth/logout");

		expect(header).toBe("abc==");
	});

	it("calls /sanctum/csrf-cookie first when the cookie is missing", async () => {
		const calls: string[] = [];
		let header: string | null = null;
		server.use(
			http.get("http://api.test/sanctum/csrf-cookie", () => {
				calls.push("csrf-cookie");
				setCookie("XSRF-TOKEN", "fresh");
				return new HttpResponse(null, { status: 204 });
			}),
			http.post("http://api.test/api/v1/auth/logout", ({ request }) => {
				calls.push("logout");
				header = request.headers.get("X-XSRF-TOKEN");
				return new HttpResponse(null, { status: 204 });
			}),
		);

		await api.POST("/api/v1/auth/logout");

		expect(calls).toEqual(["csrf-cookie", "logout"]);
		expect(header).toBe("fresh");
	});

	it("never adds X-XSRF-TOKEN to a GET", async () => {
		setCookie("XSRF-TOKEN", "token");
		let header: string | null = "unset";
		server.use(
			http.get("http://api.test/api/v1/me", ({ request }) => {
				header = request.headers.get("X-XSRF-TOKEN");
				return HttpResponse.json({ data: null });
			}),
		);

		await api.GET("/api/v1/me");

		expect(header).toBeNull();
	});
});
