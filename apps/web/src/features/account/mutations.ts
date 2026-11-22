import { useMutation, useQueryClient } from "@tanstack/react-query";
import { meQuery } from "#/features/auth/queries";
import { api } from "#/lib/api-client";
import type { ProfileInput } from "./schemas";

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (body: ProfileInput) => {
			const { data } = await api.PATCH("/api/v1/me", { body });
			if (!data?.data) throw new Error("PATCH /me returned no user");

			return data.data;
		},
		onSuccess: (user) => {
			queryClient.setQueryData(meQuery.queryKey, user);
		},
	});
}
