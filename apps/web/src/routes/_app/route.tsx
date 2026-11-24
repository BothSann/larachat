import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { VerifyBanner } from "#/features/auth/components/verify-banner";
import { meQuery } from "#/features/auth/queries";
import { ApiError } from "#/lib/api-error";

export const Route = createFileRoute("/_app")({
	ssr: false,
	beforeLoad: async ({ context, location }) => {
		try {
			await context.queryClient.query({
				...meQuery,
				staleTime: "static",
			});
			void context.queryClient.query(meQuery).catch(() => {});
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
	component: AppLayout,
});

function AppLayout() {
	return (
		<>
			<VerifyBanner />
			<Outlet />
		</>
	);
}
