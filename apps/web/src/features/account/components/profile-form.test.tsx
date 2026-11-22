import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearCookie, setCookie } from "#/test/cookies";
import { API, ada } from "#/test/render-at";
import { server } from "#/test/server";
import { ProfileForm } from "./profile-form";

beforeEach(() => setCookie("XSRF-TOKEN", "test-token"));
afterEach(() => clearCookie("XSRF-TOKEN"));

function renderForm() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { staleTime: Number.POSITIVE_INFINITY, retry: false },
		},
	});
	queryClient.setQueryData(["me"], ada);
	render(
		<QueryClientProvider client={queryClient}>
			<ProfileForm />
		</QueryClientProvider>,
	);
	return { queryClient };
}

// Fakes PATCH /me. `reply` gets the JSON body. Returns the bodies sent.
function fakePatch(
	reply: (body: Record<string, string>) => Response | Promise<Response>,
) {
	const bodies: Record<string, string>[] = [];
	server.use(
		http.patch(`${API}/me`, async ({ request }) => {
			const body = (await request.json()) as Record<string, string>;
			bodies.push(body);
			return reply(body);
		}),
	);
	return bodies;
}

const echo = (body: Record<string, string>) =>
	HttpResponse.json({
		data: { ...ada, name: body.name, username: body.username.toLowerCase() },
	});

function type(label: string, value: string) {
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

const input = (label: string) =>
	screen.getByLabelText(label) as HTMLInputElement;

describe("prefill and save", () => {
	it("starts with the name and username from ['me']", () => {
		renderForm();

		expect(input("Name").value).toBe("Ada");
		expect(input("Username").value).toBe("ada");
	});

	it("sends both fields once and says Saved.", async () => {
		const bodies = fakePatch(echo);
		renderForm();

		type("Name", "Ada B");
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect((await screen.findByRole("status")).textContent).toBe("Saved.");
		expect(bodies).toEqual([{ name: "Ada B", username: "ada" }]);
	});

	it("checks for empty fields before sending anything", async () => {
		const bodies = fakePatch(echo);
		renderForm();

		type("Name", "");
		type("Username", "");
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByText("Enter your name.")).toBeTruthy();
		expect(screen.getByText("Choose a username.")).toBeTruthy();
		expect(bodies).toEqual([]);
	});

	it("disables Save while the request is on its way", async () => {
		let release: () => void = () => {};
		fakePatch(async (body) => {
			await new Promise<void>((resolve) => {
				release = resolve;
			});
			return echo(body);
		});
		renderForm();

		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		const button = await screen.findByRole("button", { name: "Saving…" });
		expect((button as HTMLButtonElement).disabled).toBe(true);
		release();
		await screen.findByRole("status");
	});
});

describe("after save", () => {
	it("shows the server's values, e.g. Bob comes back as bob", async () => {
		fakePatch(echo);
		renderForm();

		type("Username", "Bob");
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		await screen.findByRole("status");
		await waitFor(() => expect(input("Username").value).toBe("bob"));
	});
});

describe("errors", () => {
	it("puts a 422 message under its field and doesn't say Saved.", async () => {
		fakePatch(() =>
			HttpResponse.json(
				{
					message: "The username has already been taken.",
					errors: { username: ["The username has already been taken."] },
				},
				{ status: 422 },
			),
		);
		const { queryClient } = renderForm();

		type("Username", "taken");
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		const error = await screen.findByText(
			"The username has already been taken.",
		);
		expect(input("Username").getAttribute("aria-describedby")).toBe(error.id);
		expect(screen.queryByRole("alert")).toBeNull();
		expect(screen.queryByRole("status")).toBeNull();
		expect(queryClient.getQueryData(["me"])).toEqual(ada);
	});

	it("shows any other failure above the form, and keeps what you typed", async () => {
		fakePatch(() =>
			HttpResponse.json({ message: "Unauthenticated." }, { status: 401 }),
		);
		renderForm();

		type("Name", "Ada B");
		fireEvent.click(screen.getByRole("button", { name: "Save" }));

		expect((await screen.findByRole("alert")).textContent).toBe(
			"Unauthenticated.",
		);
		expect(input("Name").value).toBe("Ada B");
	});
});
