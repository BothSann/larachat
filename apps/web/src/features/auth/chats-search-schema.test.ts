import { describe, expect, it } from "vitest";
import { chatsSearchSchema } from "./schemas";

describe("chatsSearchSchema", () => {
	it("keeps verified = 1", () => {
		expect(chatsSearchSchema.parse({ verified: 1 })).toEqual({ verified: 1 });
	});

	it("drops any other value instead of throwing", () => {
		expect(chatsSearchSchema.parse({ verified: "abc" })).toEqual({});
		expect(chatsSearchSchema.parse({ verified: 2 })).toEqual({});
	});

	it("allows no verified at all", () => {
		expect(chatsSearchSchema.parse({})).toEqual({});
	});
});
