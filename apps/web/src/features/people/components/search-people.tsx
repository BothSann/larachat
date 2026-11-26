import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TextField } from "#/components/text-field";
import { ApiError } from "#/lib/api-error";
import { searchPeopleQuery } from "../queries";
import { MIN_SEARCH_LENGTH, normalizeSearch } from "../schemas";
import { PeopleList } from "./people-list";

const chatsRoute = getRouteApi("/_app/chats");
const TYPING_PAUSE_MS = 300;

export function SearchPeople() {
	const { q } = chatsRoute.useSearch();
	const navigate = chatsRoute.useNavigate();
	const [text, setText] = useState(q ?? "");
	const search = useQuery(searchPeopleQuery(q));

	useEffect(() => {
		const next = normalizeSearch(text) || undefined;
		if (next === q) return;

		const timer = setTimeout(() => {
			navigate({ search: (prev) => ({ ...prev, q: next }), replace: true });
		}, TYPING_PAUSE_MS);
		return () => clearTimeout(timer);
	}, [text, q, navigate]);

	const fieldError =
		search.error instanceof ApiError && search.error.status === 422
			? search.error.errors.search?.[0]
			: undefined;

	function renderResults() {
		if (!q) return <p>Search for a username to find people.</p>;
		if (q.length < MIN_SEARCH_LENGTH) return <p>Type at least 2 characters.</p>;
		if (search.isLoading) return <p>Searching…</p>;
		if (search.error) {
			return fieldError ? null : (
				<p role="alert" className="text-destructive text-sm">
					{errorText(search.error)}
				</p>
			);
		}
		return search.data ? <PeopleList {...search.data} /> : null;
	}

	return (
		<section>
			<TextField
				name="q"
				label="Find people"
				autoComplete="off"
				value={text}
				error={fieldError}
				onChange={setText}
				onBlur={() => {}}
			/>
			{renderResults()}
		</section>
	);
}

function errorText(error: Error): string {
	if (error instanceof ApiError && error.status === 429) {
		return "Too many searches. Wait a minute, then try again.";
	}
	return error.message;
}
