import { QueryClient, skipToken } from "@tanstack/react-query";
import { HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { ApiError } from "#/lib/api-error";
import { bob, bobby, fakeUserRequests, page } from "#/test/people";
import { peopleQuery } from "./queries";

const client = () =>
	new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe("peopleQuery", () => {
	it("puts q in the key, and no q is the everyone list", () => {
		expect(peopleQuery("bo").queryKey).toEqual(["people", "list", "bo"]);
		expect(peopleQuery().queryKey).toEqual(["people", "list", ""]);
		expect(peopleQuery("bob").queryKey).not.toEqual(peopleQuery("bo").queryKey);
	});

	it("skips the request for 1 character", () => {
		expect(peopleQuery("b").queryFn).toBe(skipToken);
	});

	it("without q, asks for everyone: no search, no cursor", async () => {
		const requests = fakeUserRequests(() => page([bob]));

		const result = await client().fetchInfiniteQuery(peopleQuery());

		expect(requests).toEqual([""]);
		expect(result.pages).toEqual([{ people: [bob], nextCursor: undefined }]);
	});

	it("sends the search on page 1", async () => {
		const requests = fakeUserRequests(() => page([bob]));

		await client().fetchInfiniteQuery(peopleQuery("bo"));

		expect(requests).toEqual(["search=bo"]);
	});

	it("passes next_cursor back as cursor, and ends when it is null", async () => {
		const requests = fakeUserRequests((params) =>
			params.get("cursor") === "c2" ? page([bobby]) : page([bob], "c2"),
		);

		const result = await client().fetchInfiniteQuery({
			...peopleQuery("bo"),
			pages: 2,
		});

		expect(requests).toEqual(["search=bo", "search=bo&cursor=c2"]);
		expect(result.pages.map((p) => p.nextCursor)).toEqual(["c2", undefined]);
		expect(result.pages.flatMap((p) => p.people)).toEqual([bob, bobby]);
	});

	it("throws the ApiError on a refusal", async () => {
		fakeUserRequests(() =>
			HttpResponse.json({ message: "Too Many Attempts." }, { status: 429 }),
		);

		const error = await client()
			.fetchInfiniteQuery(peopleQuery("bo"))
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect((error as ApiError).status).toBe(429);
	});
});
