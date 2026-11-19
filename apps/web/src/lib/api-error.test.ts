import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";

describe("ApiError.from", () => {
	it("reads message and the 422 field map from a Laravel JSON body", async () => {
		const response = Response.json(
			{
				message: "The email field is required.",
				errors: { email: ["The email field is required."] },
			},
			{ status: 422 },
		);

		const error = await ApiError.from(response);

		expect(error).toBeInstanceOf(Error);
		expect(error.status).toBe(422);
		expect(error.message).toBe("The email field is required.");
		expect(error.errors).toEqual({ email: ["The email field is required."] });
		expect(error.code).toBeUndefined();
	});

	it("falls back to a plain message when the body is not JSON", async () => {
		const response = new Response("<html>Server Error</html>", { status: 500 });

		const error = await ApiError.from(response);

		expect(error.status).toBe(500);
		expect(error.message).toBe("Request failed with status 500");
		expect(error.errors).toEqual({});
	});
});
