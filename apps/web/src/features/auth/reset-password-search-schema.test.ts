import { describe, expect, it } from "vitest";
import { loginSearchSchema, resetPasswordSearchSchema } from "./schemas";

describe("resetPasswordSearchSchema", () => {
	it("keeps a token and a well-shaped email", () => {
		expect(
			resetPasswordSearchSchema.parse({
				token: "abc",
				email: "ada@example.com",
			}),
		).toEqual({ token: "abc", email: "ada@example.com" });
	});

	it("drops an empty token and a bad email instead of throwing", () => {
		expect(
			resetPasswordSearchSchema.parse({ token: "", email: "nope" }),
		).toEqual({});
	});

	it("drops values of the wrong type instead of throwing", () => {
		expect(resetPasswordSearchSchema.parse({ token: 123, email: 1 })).toEqual(
			{},
		);
	});

	it("allows no params at all", () => {
		expect(resetPasswordSearchSchema.parse({})).toEqual({});
	});
});

describe("loginSearchSchema", () => {
	it("keeps reset = 1", () => {
		expect(loginSearchSchema.parse({ reset: 1 })).toEqual({ reset: 1 });
	});

	it("drops any other value instead of throwing", () => {
		expect(loginSearchSchema.parse({ reset: "yes" })).toEqual({});
		expect(loginSearchSchema.parse({ reset: 2 })).toEqual({});
	});
});
