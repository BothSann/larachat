import { createFileRoute, redirect } from "@tanstack/react-router";
import { meQuery } from "#/features/auth/queries";
import { ApiError } from "#/lib/api-error";

export const Route = createFileRoute("/_app")({
	ssr: false,
	beforeLoad: async ({ context, location }) => {
		try {
			await context.queryClient.ensureQueryData(meQuery);
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				throw redirect({
					to: "/login",
					search: {
						redirect: location.href,
					},
				});
			}
			throw error;
		}
	},
});
