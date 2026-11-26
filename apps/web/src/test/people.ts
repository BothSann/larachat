import { HttpResponse, http } from "msw";
import { API, ada } from "./render-at";
import { server } from "./server";

export const verifiedAda = {
	...ada,
	email_verified_at: "2026-11-20T00:00:00.000000Z",
};

export const bob = {
	id: "01jd0000000000000000000001",
	name: "Bob",
	username: "bob",
};
export const bobby = {
	id: "01jd0000000000000000000002",
	name: "Bobby Tables",
	username: "bobby",
};

export function fakeMeIs(user: typeof ada | typeof verifiedAda) {
	server.use(http.get(`${API}/me`, () => HttpResponse.json({ data: user })));
}

export function page(people: object[], next_cursor: string | null = null) {
	return HttpResponse.json({
		data: people,
		links: { first: null, last: null, prev: null, next: null },
		meta: { path: "/", per_page: 30, next_cursor, prev_cursor: null },
	});
}

// Fakes GET /users. Returns the list of searches it was asked for.
export function fakeUsers(
	answer: (search: string | null) => Response | Promise<Response>,
) {
	const searches: (string | null)[] = [];
	server.use(
		http.get(`${API}/users`, ({ request }) => {
			const search = new URL(request.url).searchParams.get("search");
			searches.push(search);
			return answer(search);
		}),
	);
	return searches;
}
