import { afterAll, afterEach } from "vitest";
import { server } from "./server";

// Listen now, not in beforeAll: openapi-fetch keeps the `fetch` it sees
// when api-client.ts is imported, so MSW must patch fetch before that.
server.listen({ onUnhandledFrame: "error" });
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
