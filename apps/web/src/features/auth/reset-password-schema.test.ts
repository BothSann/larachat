import { describe, expect, it } from "vitest";
import { resetPasswordSchema } from "./schemas";

describe("resetPasswordSchema", () => {
	it("accepts 8 matching characters", () => {
		const result = resetPasswordSchema.safeParse({
			password: "12345678",
			password_confirmation: "12345678",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a password under 8 characters", () => {
		const result = resetPasswordSchema.safeParse({
			password: "1234567",
			password_confirmation: "1234567",
		});
		expect(result.error?.issues[0]?.message).toBe("Use at least 8 characters.");
	});

	it("puts a mismatch on the confirmation field", () => {
		const result = resetPasswordSchema.safeParse({
			password: "new-password-1",
			password_confirmation: "new-password-2",
		});
		expect(result.error?.issues[0]?.message).toBe("Passwords don't match.");
		expect(result.error?.issues[0]?.path).toEqual(["password_confirmation"]);
	});
});
