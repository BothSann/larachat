import { queryOptions } from "@tanstack/react-query";
import { api } from "#/lib/api-client";

export const meQuery = queryOptions({
	queryKey: ["me"],
	queryFn: async () => {
		const { data } = await api.GET("/api/v1/me");
		if (!data?.data) throw new Error("GET /me returned no user");
		return data.data;
	},
});
