import { useForm } from "@tanstack/react-form";
import { TextField } from "#/components/text-field";
import { Button } from "#/components/ui/button";
import { formErrorText } from "#/features/auth/form-error";
import { ApiError } from "#/lib/api-error";
import { useChangePassword } from "../mutations";
import { changePasswordSchema } from "../schemas";

export function ChangePasswordForm() {
	const changePassword = useChangePassword();

	const form = useForm({
		defaultValues: {
			current_password: "",
			password: "",
			password_confirmation: "",
		},
		validators: {
			onSubmit: changePasswordSchema,
		},
		onSubmit: ({ value }) => {
			changePassword.mutate(value, {
				onSuccess: () => form.reset(),
			});
		},
	});

	const fieldErrors =
		changePassword.error instanceof ApiError &&
		changePassword.error.status === 422
			? changePassword.error.errors
			: null;

	const formError = formErrorText(changePassword.error);

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

			{changePassword.isSuccess && (
				<p role="status" className="text-sm">
					Password changed.
				</p>
			)}

			<form.Field name="current_password">
				{(field) => (
					<TextField
						name={field.name}
						label="Current password"
						type="password"
						autoComplete="current-password"
						value={field.state.value}
						error={
							field.state.meta.errors[0]?.message ??
							fieldErrors?.current_password?.[0]
						}
						onChange={field.handleChange}
						onBlur={field.handleBlur}
					/>
				)}
			</form.Field>

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
						label="Confirm new password"
						type="password"
						autoComplete="new-password"
						value={field.state.value}
						error={field.state.meta.errors[0]?.message}
						onChange={field.handleChange}
						onBlur={field.handleBlur}
					/>
				)}
			</form.Field>

			<Button type="submit" disabled={changePassword.isPending}>
				{changePassword.isPending ? "Saving…" : "Change password"}
			</Button>
		</form>
	);
}
