import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "#/lib/api-client";
import { ApiError } from "#/lib/api-error";
import { meQuery } from "./queries";
import type {
	ForgotPasswordInput,
	LoginInput,
	RegisterInput,
	ResetPasswordInput,
} from "./schemas";

type ResetPasswordBody = ResetPasswordInput & { token: string; email: string };

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

export function useRegister() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (body: RegisterInput) => {
			const { data } = await api.POST("/api/v1/auth/register", { body });
			if (!data?.data) throw new Error("POST /register returned no user");

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

export function useResendVerification() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			try {
				await api.POST("/api/v1/auth/email/verification-notification");

				return "sent" as const;
			} catch (error) {
				if (error instanceof ApiError && error.code === "already_verified") {
					return "already_verified" as const;
				}
				throw error;
			}
		},
		onSuccess: async (result) => {
			if (result === "already_verified") {
				await queryClient.invalidateQueries({
					queryKey: meQuery.queryKey,
				});
			}
		},
	});
}

export function useForgotPassword() {
	return useMutation({
		mutationFn: async (body: ForgotPasswordInput) => {
			await api.POST("/api/v1/auth/forgot-password", { body });
		},
	});
}

export function useResetPassword() {
	return useMutation({
		mutationFn: async (body: ResetPasswordBody) => {
			await api.POST("/api/v1/auth/reset-password", { body });
		},
	});
}
