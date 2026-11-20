import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
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

	setupRouterSsrQueryIntegration({ router, queryClient });

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
