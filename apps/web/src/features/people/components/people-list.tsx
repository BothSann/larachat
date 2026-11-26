type PeopleListProps = {
	people: { id: string; name: string; username: string }[];
	hasMore: boolean;
};

export function PeopleList({ people, hasMore }: PeopleListProps) {
	if (people.length === 0) return <p className="text-sm">No one found.</p>;

	return (
		<>
			<ul className="grid gap-2">
				{people.map((person) => (
					<li key={person.id} className="flex gap-2">
						<span>{person.name}</span>
						<span className="text-muted-foreground">@{person.username}</span>
					</li>
				))}
			</ul>
			{hasMore && <p className="text-sm">Keep typing to narrow the list.</p>}
		</>
	);
}
