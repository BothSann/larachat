import { describe, expect, it } from "vitest";
import { registerSchema } from "./schemas";

const valid = {
	name: "Ada Lovelace",
	username: "ada",
	email: "ada@example.com",
	password: "secret123",
	password_confirmation: "secret123",
};

describe("registerSchema", () => {
	it("accepts a valid sign-up", () => {
		expect(registerSchema.safeParse(valid).success).toBe(true);
	});

	it("puts a password mismatch on the confirm field", () => {
		const result = registerSchema.safeParse({
			...valid,
			password_confirmation: "secret124",
		});
		expect(result.error?.issues).toEqual([
			expect.objectContaining({
				message: "Passwords don't match.",
				path: ["password_confirmation"],
			}),
		]);
	});

	it("still checks the match when another field fails", () => {
		const result = registerSchema.safeParse({
			...valid,
			name: "",
			password_confirmation: "secret124",
		});
		expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
			"name",
			"password_confirmation",
		]);
	});

	it("rejects a password under 8 characters", () => {
		const result = registerSchema.safeParse({
			...valid,
			password: "short",
			password_confirmation: "short",
		});
		expect(result.error?.issues[0]?.message).toBe("Use at least 8 characters.");
	});

	it("leaves the username pattern to Laravel", () => {
		const result = registerSchema.safeParse({
			...valid,
			username: "bad name!",
		});
		expect(result.success).toBe(true);
	});

	it("asks for every empty field", () => {
		const result = registerSchema.safeParse({
			name: "",
			username: "",
			email: "",
			password: "",
			password_confirmation: "",
		});
		expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
			"name",
			"username",
			"email",
			"password",
		]);
	});
});
