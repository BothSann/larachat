import { createFileRoute, redirect } from "@tanstack/react-router";
import { meQuery } from "#/features/auth/queries";
import { safeRedirect } from "#/features/auth/redirect";
import { guestSearchSchema } from "#/features/auth/schemas";
import { ApiError } from "#/lib/api-error";

export const Route = createFileRoute("/_guest")({
	ssr: false,
	validateSearch: guestSearchSchema,
	beforeLoad: async ({ context, search }) => {
		const user = await context.queryClient
			.ensureQueryData(meQuery)
			.catch((error: unknown) => {
				if (error instanceof ApiError && error.status === 401) return null;
				throw error;
			});
		if (user) throw redirect({ href: safeRedirect(search.redirect) });
	},
});
