import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, vi } from "vitest";
import { server } from "./server";

// Listen now, not in beforeAll: openapi-fetch keeps the `fetch` it sees
// when api-client.ts is imported, so MSW must patch fetch before that.
server.listen({ onUnhandledFrame: "error" });
afterEach(() => {
	cleanup();
	server.resetHandlers();
});
afterAll(() => server.close());

// Under jsdom, @tanstack/react-devtools loads its server build, which throws
// "Devtools is not mounted" on unmount. Route tests don't need devtools.
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
