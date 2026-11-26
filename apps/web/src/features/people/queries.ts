import {
	keepPreviousData,
	queryOptions,
	skipToken,
} from "@tanstack/react-query";
import { api } from "#/lib/api-client";
import { MIN_SEARCH_LENGTH } from "./schemas";

export function searchPeopleQuery(q = "") {
	return queryOptions({
		queryKey: ["people", "search", q],
		queryFn:
			q.length < MIN_SEARCH_LENGTH
				? skipToken
				: async ({ signal }) => {
						const { data } = await api.GET("/api/v1/users", {
							params: { query: { search: q } },
							signal,
						});
						if (!data?.data) throw new Error("GET /users returned no list");
						return {
							people: data.data,
							hasMore: Boolean(data.meta?.next_cursor),
						};
					},
		placeholderData: keepPreviousData,
	});
}
