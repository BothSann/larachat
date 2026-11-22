import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

type TextFieldProps = {
	// ①
	name: string;
	label: string;
	type?: "text" | "email" | "password";
	autoComplete: string;
	value: string;
	error: string | undefined;
	onChange: (value: string) => void; // ②
	onBlur: () => void;
};

export function TextField({
	name,
	label,
	type = "text",
	autoComplete,
	value,
	error,
	onChange,
	onBlur,
}: TextFieldProps) {
	const errorId = `${name}-error`; // ③

	return (
		<div className="grid gap-2">
			<Label htmlFor={name}>{label}</Label>
			<Input
				id={name}
				name={name}
				type={type}
				autoComplete={autoComplete}
				value={value}
				onBlur={onBlur}
				onChange={(event) => onChange(event.target.value)}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
			/>
			{error && (
				<p id={errorId} className="text-destructive text-sm">
					{error}
				</p>
			)}
		</div>
	);
}
