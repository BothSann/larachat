import { describe, expect, it } from "vitest";
import { normalizeSearch, peopleSearchSchema } from "./schemas";

describe("normalizeSearch", () => {
	it.each([
		["bo", "bo"],
		["@Bo", "bo"],
		["  Bo ", "bo"],
		["@@bo", "@bo"],
		["b%", "b%"],
		["   ", ""],
		["@", ""],
	])("%j becomes %j", (typed, expected) => {
		expect(normalizeSearch(typed)).toBe(expected);
	});
});

describe("peopleSearchSchema", () => {
	it.each([
		["bo", "bo"],
		["@Bo", "bo"],
		[42, "42"],
		["42", "42"],
		["b", "b"],
	])("q %j becomes %j", (q, expected) => {
		expect(peopleSearchSchema.parse({ q })).toEqual({ q: expected });
	});

	it.each([[true], [null], [["bo"]], [{ a: 1 }], [""], ["@"], [undefined]])(
		"q %j counts as no q",
		(q) => {
			expect(peopleSearchSchema.parse({ q }).q).toBeUndefined();
		},
	);

	it("allows no q at all", () => {
		expect(peopleSearchSchema.parse({}).q).toBeUndefined();
	});
});
