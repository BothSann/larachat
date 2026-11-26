import {
	infiniteQueryOptions,
	keepPreviousData,
	skipToken,
} from "@tanstack/react-query";
import { api } from "#/lib/api-client";
import { MIN_SEARCH_LENGTH } from "./schemas";

export function peopleQuery(q?: string) {
	return infiniteQueryOptions({
		queryKey: ["people", "list", q ?? ""],
		queryFn:
			q !== undefined && q.length < MIN_SEARCH_LENGTH
				? skipToken
				: async ({ pageParam, signal }) => {
						const { data } = await api.GET("/api/v1/users", {
							params: { query: { search: q, cursor: pageParam } },
							signal,
						});
						if (!data?.data) throw new Error("GET /users returned no list");
						return {
							people: data.data,
							nextCursor: data.meta?.next_cursor ?? undefined,
						};
					},
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (lastPage) => lastPage.nextCursor,
		placeholderData: keepPreviousData,
	});
}
