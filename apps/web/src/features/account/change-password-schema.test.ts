import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./schemas";

const valid = {
	current_password: "old-secret-password",
	password: "new-secret-password",
	password_confirmation: "new-secret-password",
};

describe("changePasswordSchema", () => {
	it("accepts a current password and 8+ matching characters", () => {
		expect(changePasswordSchema.safeParse(valid).success).toBe(true);
	});

	it("asks for the current password when it's empty", () => {
		const result = changePasswordSchema.safeParse({
			...valid,
			current_password: "",
		});
		expect(result.error?.issues[0]?.message).toBe(
			"Enter your current password.",
		);
		expect(result.error?.issues[0]?.path).toEqual(["current_password"]);
	});

	it("rejects a new password under 8 characters", () => {
		const result = changePasswordSchema.safeParse({
			...valid,
			password: "1234567",
			password_confirmation: "1234567",
		});
		expect(result.error?.issues[0]?.message).toBe("Use at least 8 characters.");
		expect(result.error?.issues[0]?.path).toEqual(["password"]);
	});

	it("puts a mismatch on the confirmation field", () => {
		const result = changePasswordSchema.safeParse({
			...valid,
			password_confirmation: "new-secret-password-2",
		});
		expect(result.error?.issues[0]?.message).toBe("Passwords don't match.");
		expect(result.error?.issues[0]?.path).toEqual(["password_confirmation"]);
	});

	it("leaves 'same as current' to the server", () => {
		const result = changePasswordSchema.safeParse({
			current_password: "same-secret-password",
			password: "same-secret-password",
			password_confirmation: "same-secret-password",
		});
		expect(result.success).toBe(true);
	});
});
