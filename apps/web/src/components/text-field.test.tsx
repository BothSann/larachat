import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextField } from "./text-field";

function renderField(error: string | undefined) {
	const onChange = vi.fn();
	const onBlur = vi.fn();
	render(
		<TextField
			name="username"
			label="Username"
			autoComplete="username"
			value="ada"
			error={error}
			onChange={onChange}
			onBlur={onBlur}
		/>,
	);
	return { input: screen.getByLabelText("Username"), onChange, onBlur };
}

describe("TextField", () => {
	it("labels the input and passes typing and blur up as plain values", () => {
		const { input, onChange, onBlur } = renderField(undefined);

		fireEvent.change(input, { target: { value: "ada_l" } });
		fireEvent.blur(input);

		expect(input.getAttribute("type")).toBe("text");
		expect(onChange).toHaveBeenCalledWith("ada_l");
		expect(onBlur).toHaveBeenCalledOnce();
		expect(input.getAttribute("aria-invalid")).toBeNull();
		expect(input.getAttribute("aria-describedby")).toBeNull();
	});

	it("links the error text to the input", () => {
		const { input } = renderField("The username has already been taken.");

		const error = screen.getByText("The username has already been taken.");
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(input.getAttribute("aria-describedby")).toBe(error.id);
	});
});
