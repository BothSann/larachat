import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TextField } from "#/components/text-field";
import { Button } from "#/components/ui/button";
import { ApiError } from "#/lib/api-error";
import { peopleQuery } from "../queries";
import { MIN_SEARCH_LENGTH, normalizeSearch } from "../schemas";
import { PeopleList } from "./people-list";

const chatsRoute = getRouteApi("/_app/chats");
const TYPING_PAUSE_MS = 300;

export function SearchPeople() {
	const { q } = chatsRoute.useSearch();
	const navigate = chatsRoute.useNavigate();
	const [text, setText] = useState(q ?? "");
	const people = useInfiniteQuery(peopleQuery(q));
	const queryClient = useQueryClient();

	useEffect(() => {
		queryClient.removeQueries({
			queryKey: ["people", "list"],
			predicate: (query) => query.queryKey[2] !== (q ?? ""),
		});
	}, [q, queryClient]);

	useEffect(() => {
		const next = normalizeSearch(text) || undefined;
		if (next === q) return;

		const timer = setTimeout(() => {
			navigate({ search: (prev) => ({ ...prev, q: next }), replace: true });
		}, TYPING_PAUSE_MS);
		return () => clearTimeout(timer);
	}, [text, q, navigate]);

	function loadMore() {
		if (people.hasNextPage && !people.isFetching) void people.fetchNextPage();
	}

	const fieldError =
		people.error instanceof ApiError && people.error.status === 422
			? people.error.errors.search?.[0]
			: undefined;

	function renderResults() {
		if (q && q.length < MIN_SEARCH_LENGTH) {
			return <p>Type at least 2 characters.</p>;
		}
		if (people.isLoading) return <p>Loading people…</p>;
		if (!people.data) {
			return people.error && !fieldError ? (
				<p role="alert" className="text-destructive text-sm">
					{errorText(people.error)}
				</p>
			) : null;
		}

		return (
			<div className={people.isPlaceholderData ? "opacity-60" : undefined}>
				<PeopleList
					people={people.data.pages.flatMap((page) => page.people)}
					q={q}
				/>
				{people.hasNextPage && (
					<div className="mt-3 flex items-center gap-3">
						<Button
							variant="outline"
							disabled={people.isFetching}
							onClick={loadMore}
						>
							{people.isFetchingNextPage ? "Loading…" : "Load more"}
						</Button>

						{people.isFetchNextPageError && (
							<p role="alert" className="text-destructive text-sm">
								{errorText(people.error)}
							</p>
						)}
					</div>
				)}
			</div>
		);
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
