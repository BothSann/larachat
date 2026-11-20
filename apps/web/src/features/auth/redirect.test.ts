import { describe, expect, it } from "vitest";
import { safeRedirect } from "./redirect";

describe("safeRedirect", () => {
	it("keeps a path inside the app", () => {
		expect(safeRedirect("/chats/1")).toBe("/chats/1");
		expect(safeRedirect("/chats?tab=all")).toBe("/chats?tab=all");
	});

	it.each([
		["another site with //", "//evil.com"],
		["another site with /\\", "/\\evil.com"],
		["a full URL", "https://x.com"],
		["a relative path", "chats"],
		["an empty string", ""],
		["nothing", undefined],
	])("falls back to /chats for %s", (_label, target) => {
		expect(safeRedirect(target)).toBe("/chats");
	});
});
