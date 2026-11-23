import { useForm } from "@tanstack/react-form";
import { TextField } from "#/components/text-field";
import { Button } from "#/components/ui/button";
import { ApiError } from "#/lib/api-error";
import { formErrorText } from "../form-error";
import { useForgotPassword } from "../mutations";
import { forgotPasswordSchema } from "../schemas";

export function ForgotPasswordForm() {
	const forgot = useForgotPassword();
	const form = useForm({
		defaultValues: {
			email: "",
		},
		validators: {
			onSubmit: forgotPasswordSchema,
		},
		onSubmit: ({ value }) => {
			forgot.mutate(value);
		},
	});

	if (forgot.isSuccess) {
		return (
			<p role="status" className="max-w-sm text-sm">
				If that email has an account, we've sent a reset link. Check your inbox.
			</p>
		);
	}

	const fieldErrors =
		forgot.error instanceof ApiError && forgot.error.status === 422
			? forgot.error.errors
			: null;

	const formError = formErrorText(forgot.error);

	return (
		<form
			noValidate
			className="grid max-w-sm gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			{formError && (
				<p role="alert" className="text-destructive text-sm">
					{formError}
				</p>
			)}

			<form.Field name="email">
				{(field) => (
					<TextField
						name={field.name}
						label="Email"
						type="email"
						autoComplete="email"
						value={field.state.value}
						error={
							field.state.meta.errors[0]?.message ?? fieldErrors?.email?.[0]
						}
						onChange={field.handleChange}
						onBlur={field.handleBlur}
					/>
				)}
			</form.Field>

			<Button type="submit" disabled={forgot.isPending}>
				{forgot.isPending ? "Sending…" : "Send reset link"}
			</Button>
		</form>
	);
}
