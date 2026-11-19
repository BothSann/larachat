import type { Middleware } from "openapi-fetch";
import createClient from "openapi-fetch";
import type { paths } from "./api/schema";
import { ApiError } from "./api-error";

const baseUrl = import.meta.env.VITE_API_URL;
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function readCookie(name: string): string | undefined {
	const match = document.cookie
		.split("; ")
		.find((pair) => pair.startsWith(`${name}=`));
	return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

async function xsrfToken(): Promise<string | undefined> {
	const token = readCookie("XSRF-TOKEN");
	if (token) return token;
	await fetch(`${baseUrl}/sanctum/csrf-cookie`, { credentials: "include" });
	return readCookie("XSRF-TOKEN");
}

const csrf: Middleware = {
	async onRequest({ request }) {
		if (SAFE_METHODS.includes(request.method)) return;
		const token = await xsrfToken();
		if (token) request.headers.set("X-XSRF-TOKEN", token);
		return request;
	},
};

const throwOnError: Middleware = {
	async onResponse({ response }) {
		if (!response.ok) throw await ApiError.from(response);
	},
};

export const api = createClient<paths>({
	baseUrl,
	credentials: "include",
	headers: { Accept: "application/json" },
});

api.use(csrf, throwOnError);
