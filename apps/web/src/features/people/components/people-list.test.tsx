import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bob, bobby } from "#/test/people";
import { PeopleList } from "./people-list";

const MORE = "Keep typing to narrow the list.";

describe("PeopleList", () => {
	it("shows the name and @username of each person, in order", () => {
		render(<PeopleList people={[bob, bobby]} hasMore={false} />);

		const rows = screen.getAllByRole("listitem");
		expect(rows).toHaveLength(2);
		expect(rows[0].textContent).toContain("Bob");
		expect(rows[0].textContent).toContain("@bob");
		expect(rows[1].textContent).toContain("Bobby Tables");
		expect(rows[1].textContent).toContain("@bobby");
		expect(screen.queryByText(MORE)).toBeNull();
	});

	it("says when there are more", () => {
		render(<PeopleList people={[bob]} hasMore={true} />);
		expect(screen.getByText(MORE)).toBeTruthy();
	});

	it("says when no one matches", () => {
		render(<PeopleList people={[]} hasMore={false} />);
		expect(screen.getByText("No one found.")).toBeTruthy();
		expect(screen.queryByRole("list")).toBeNull();
	});
});
