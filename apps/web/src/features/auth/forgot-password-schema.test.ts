import { describe, expect, it } from "vitest";
import { forgotPasswordSchema } from "./schemas";

describe("forgotPasswordSchema", () => {
	it("accepts a well-shaped email", () => {
		const result = forgotPasswordSchema.safeParse({
			email: "ada@example.com",
		});
		expect(result.success).toBe(true);
	});

	it("rejects an empty email", () => {
		const result = forgotPasswordSchema.safeParse({ email: "" });
		expect(result.error?.issues[0]?.message).toBe(
			"Enter a valid email address.",
		);
	});

	it("rejects a badly shaped email", () => {
		const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
		expect(result.error?.issues[0]?.message).toBe(
			"Enter a valid email address.",
		);
	});
});
