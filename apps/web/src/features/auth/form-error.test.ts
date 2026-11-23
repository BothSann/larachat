import { describe, expect, it } from "vitest";
import { ApiError } from "#/lib/api-error";
import { formErrorText } from "./form-error";

describe("formErrorText", () => {
	it("returns null when there is no error", () => {
		expect(formErrorText(null)).toBeNull();
	});

	it("returns null for a 422, because it belongs under a field", () => {
		const error = new ApiError(422, {
			message: "Bad",
			errors: { email: ["Bad"] },
		});
		expect(formErrorText(error)).toBeNull();
	});

	it("returns the wait message for a 429", () => {
		const error = new ApiError(429, { message: "Too Many Attempts." });
		expect(formErrorText(error)).toBe(
			"Too many tries. Wait a minute and try again.",
		);
	});

	it("returns the message for anything else", () => {
		expect(formErrorText(new Error("Failed to fetch"))).toBe("Failed to fetch");
		expect(formErrorText(new ApiError(500, { message: "Server Error" }))).toBe(
			"Server Error",
		);
	});
});
