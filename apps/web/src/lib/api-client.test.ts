import { HttpResponse, http } from "msw";
import type { Middleware } from "openapi-fetch";
import { describe, expect, it } from "vitest";
import { setCookie } from "#/test/cookies";
import { server } from "#/test/server";
import { api } from "./api-client";
import { ApiError } from "./api-error";

const user = {
	id: "01jd0000000000000000000000",
	name: "Ada Lovelace",
	username: "ada",
	email: "ada@example.com",
	email_verified_at: null,
	created_at: "2026-11-19T00:00:00.000000Z",
};

describe("api client", () => {
	it("returns the user from GET /me and sends cookie + JSON headers", async () => {
		let accept: string | null = null;
		server.use(
			http.get("http://api.test/api/v1/me", ({ request }) => {
				accept = request.headers.get("Accept");
				return HttpResponse.json({ data: user });
			}),
		);
		// MSW rebuilds the request it hands to handlers and drops `credentials`,
		// so read it from the client's own Request before it is sent.
		let credentials: RequestCredentials | undefined;
		const spy: Middleware = {
			onRequest({ request }) {
				credentials = request.credentials;
			},
		};
		api.use(spy);

		const { data } = await api.GET("/api/v1/me").finally(() => api.eject(spy));

		expect(data).toEqual({ data: user });
		expect(credentials).toBe("include");
		expect(accept).toBe("application/json");
	});

	it("throws an ApiError with status 401 when logged out", async () => {
		server.use(
			http.get("http://api.test/api/v1/me", () =>
				HttpResponse.json({ message: "Unauthenticated." }, { status: 401 }),
			),
		);

		const error = await api.GET("/api/v1/me").catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 401, message: "Unauthenticated." });
	});

	it("puts 422 field errors on ApiError.errors", async () => {
		setCookie("XSRF-TOKEN", "token");
		server.use(
			http.post("http://api.test/api/v1/auth/login", () =>
				HttpResponse.json(
					{
						message: "These credentials do not match our records.",
						errors: { email: ["These credentials do not match our records."] },
					},
					{ status: 422 },
				),
			),
		);

		const error = await api
			.POST("/api/v1/auth/login", {
				body: { email: "ada@example.com", password: "wrong" },
			})
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({
			status: 422,
			errors: { email: ["These credentials do not match our records."] },
		});
	});
});
