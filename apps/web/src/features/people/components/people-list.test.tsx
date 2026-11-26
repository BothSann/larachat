import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bob, bobby } from "#/test/people";
import { PeopleList } from "./people-list";

describe("PeopleList", () => {
	it("shows the name and @username of each person, in order", () => {
		render(<PeopleList people={[bob, bobby]} />);

		const rows = screen.getAllByRole("listitem");
		expect(rows).toHaveLength(2);
		expect(rows[0].textContent).toContain("Bob");
		expect(rows[0].textContent).toContain("@bob");
		expect(rows[1].textContent).toContain("Bobby Tables");
		expect(rows[1].textContent).toContain("@bobby");
	});

	it("says no one else is here when there is no search", () => {
		render(<PeopleList people={[]} />);
		expect(screen.getByText("No one else is here yet.")).toBeTruthy();
		expect(screen.queryByRole("list")).toBeNull();
	});

	it("names the search when no username matches", () => {
		render(<PeopleList people={[]} q="bo" />);
		expect(screen.getByText('No usernames start with "bo".')).toBeTruthy();
		expect(screen.queryByRole("list")).toBeNull();
	});
});
