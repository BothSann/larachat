type PeopleListProps = {
	people: { id: string; name: string; username: string }[];
	q?: string;
};

export function PeopleList({ people, q }: PeopleListProps) {
	if (people.length === 0)
		return (
			<p className="text-sm">
				{q ? `No usernames start with "${q}".` : "No one else is here yet."}
			</p>
		);

	return (
		<ul className="grid gap-2">
			{people.map((person) => (
				<li key={person.id} className="flex gap-2">
					<span>{person.name}</span>
					<span className="text-muted-foreground">@{person.username}</span>
				</li>
			))}
		</ul>
	);
}
