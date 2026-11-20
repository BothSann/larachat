import { describe, expect, it } from "vitest";
import { guestSearchSchema } from "./schemas";

describe("guestSearchSchema", () => {
	it("keeps a string redirect", () => {
		expect(guestSearchSchema.parse({ redirect: "/chats" })).toEqual({
			redirect: "/chats",
		});
	});

	it("allows no redirect at all", () => {
		expect(guestSearchSchema.parse({})).toEqual({});
	});

	it("turns a non-string redirect into undefined instead of throwing", () => {
		expect(guestSearchSchema.parse({ redirect: 123 })).toEqual({
			redirect: undefined,
		});
	});
});
