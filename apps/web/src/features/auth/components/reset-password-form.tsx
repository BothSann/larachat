import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { TextField } from "#/components/text-field";
import { Button } from "#/components/ui/button";
import { ApiError } from "#/lib/api-error";
import { formErrorText } from "../form-error";
import { useResetPassword } from "../mutations";
import { resetPasswordSchema } from "../schemas";
import { BrokenResetLink } from "./broken-reset-link";

type ResetPasswordFormProps = {
	token: string;
	email: string;
};

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
	const reset = useResetPassword();
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			password: "",
			password_confirmation: "",
		},
		validators: {
			onSubmit: resetPasswordSchema,
		},
		onSubmit: ({ value }) => {
			reset.mutate(
				{
					token,
					email,
					...value,
				},
				{
					onSuccess: () =>
						navigate({
							to: "/login",
							search: { reset: 1 },
							replace: true,
						}),
				},
			);
		},
	});

	const fieldErrors =
		reset.error instanceof ApiError && reset.error.status === 422
			? reset.error.errors
			: null;

	if (fieldErrors?.token) return <BrokenResetLink />;

	const formError = formErrorText(reset.error);

	return (
		<form
			noValidate
			className="grid max-w-sm gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				form.handleSubmit();
			}}
		>
			<p className="text-sm">Set a new password for {email}</p>

			{formError && (
				<p role="alert" className="text-destructive text-sm">
					{formError}
				</p>
			)}

			<form.Field name="password">
				{(field) => (
					<TextField
						name={field.name}
						label="New password"
						type="password"
						autoComplete="new-password"
						value={field.state.value}
						error={
							field.state.meta.errors[0]?.message ?? fieldErrors?.password?.[0]
						}
						onChange={field.handleChange}
						onBlur={field.handleBlur}
					/>
				)}
			</form.Field>

			<form.Field name="password_confirmation">
				{(field) => (
					<TextField
						name={field.name}
						label="Confirm password"
						type="password"
						autoComplete="new-password"
						value={field.state.value}
						error={field.state.meta.errors[0]?.message}
						onChange={field.handleChange}
						onBlur={field.handleBlur}
					/>
				)}
			</form.Field>
			<Button type="submit" disabled={reset.isPending}>
				{reset.isPending ? "Saving…" : "Set new password"}
			</Button>
		</form>
	);
}
