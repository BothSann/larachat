import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { meQuery } from "./features/auth/queries";
import { ApiError } from "./lib/api-error";
import { routeTree } from "./routeTree.gen";

function shouldRetry(failureCount: number, error: Error) {
	if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
		return false;
	}
	return failureCount < 3;
}

export function getRouter() {
	const queryClient = new QueryClient({
		queryCache: new QueryCache({ onError: handleSessionEnded }),
		mutationCache: new MutationCache({ onError: handleSessionEnded }),
		defaultOptions: {
			queries: { staleTime: 30_000, retry: shouldRetry },
		},
	});

	const router = createTanStackRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	function handleSessionEnded(error: Error): void {
		if (!(error instanceof ApiError) || error.status !== 401) return;
		if (queryClient.getQueryData(meQuery.queryKey) === undefined) return;

		queryClient.clear();
		void router.navigate({
			to: "/login",
			search: { redirect: router.state.location.href, ended: 1 },
		});
	}

	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
