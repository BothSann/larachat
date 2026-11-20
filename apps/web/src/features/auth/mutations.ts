import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { meQuery } from "./queries";
import type { LoginInput } from "./schemas";

export function useLogin() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (body: LoginInput) => {
			const { data } = await api.POST("/api/v1/auth/login", { body });
			if (!data?.data) throw new Error("POST /login returned no user");

			return data.data;
		},
		onSuccess: (user) => {
			queryClient.clear();
			queryClient.setQueryData(meQuery.queryKey, user);
		},
	});
}

export function useLogout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			try {
				await api.POST("/api/v1/auth/logout");
			} catch (error) {
				if (error instanceof ApiError && error.status === 401) return;
				throw error;
			}
		},
		onSuccess: () => {
			queryClient.clear();
		},
	});
}
