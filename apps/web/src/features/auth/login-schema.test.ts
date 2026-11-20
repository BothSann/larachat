import { describe, expect, it } from "vitest";
import { loginSchema } from "./schemas";

describe("loginSchema", () => {
	it("accepts any non-empty password, even a short one", () => {
		const result = loginSchema.safeParse({
			email: "ada@example.com",
			password: "x",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a badly shaped email", () => {
		const result = loginSchema.safeParse({ email: "nope", password: "x" });
		expect(result.error?.issues[0]?.message).toBe(
			"Enter a valid email address.",
		);
	});

	it("rejects an empty password", () => {
		const result = loginSchema.safeParse({
			email: "ada@example.com",
			password: "",
		});
		expect(result.error?.issues[0]?.message).toBe("Enter your password.");
	});
});
