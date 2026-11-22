import { describe, expect, it } from "vitest";
import { profileSchema } from "./schemas";

describe("profileSchema", () => {
	it("accepts a name and a username", () => {
		expect(
			profileSchema.safeParse({ name: "Ada B", username: "ada" }).success,
		).toBe(true);
	});

	it("asks for a name when it's empty", () => {
		const result = profileSchema.safeParse({ name: "", username: "ada" });
		expect(result.error?.issues).toEqual([
			expect.objectContaining({ message: "Enter your name.", path: ["name"] }),
		]);
	});

	it("asks for a username when it's empty, and leaves its format to Laravel", () => {
		const empty = profileSchema.safeParse({ name: "Ada", username: "" });
		expect(empty.error?.issues).toEqual([
			expect.objectContaining({
				message: "Choose a username.",
				path: ["username"],
			}),
		]);
		expect(
			profileSchema.safeParse({ name: "Ada", username: "Not Valid!" }).success,
		).toBe(true);
	});
});
