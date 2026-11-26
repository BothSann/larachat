import { QueryClient, skipToken } from "@tanstack/react-query";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ApiError } from "#/lib/api-error";
import { bob, fakeUsers, page } from "#/test/people";
import { searchPeopleQuery } from "./queries";

const client = () =>
	new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("searchPeopleQuery", () => {
	it("puts the search in the key, so each search has its own entry", () => {
		expect(searchPeopleQuery("bo").queryKey).toEqual([
			"people",
			"search",
			"bo",
		]);
		expect(searchPeopleQuery("bob").queryKey).not.toEqual(
			searchPeopleQuery("bo").queryKey,
		);
	});

	it.each([[undefined], [""], ["b"]])("skips the request for %j", (q) => {
		expect(searchPeopleQuery(q).queryFn).toBe(skipToken);
	});

	it("sends the search and returns the people", async () => {
		const searches = fakeUsers(() => page([bob]));

		const result = await client().query(searchPeopleQuery("bo"));

		expect(searches).toEqual(["bo"]);
		expect(result).toEqual({ people: [bob], hasMore: false });
	});

	it("has more when there is a next cursor", async () => {
		fakeUsers(() => page([bob], "abc"));

		const result = await client().query(searchPeopleQuery("bo"));

		expect(result.hasMore).toBe(true);
	});

	it("throws the ApiError on a refusal", async () => {
		fakeUsers(() =>
			HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
		);

		const error = await client()
			.query(searchPeopleQuery("bo"))
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).status).toBe(429);
	});
});
