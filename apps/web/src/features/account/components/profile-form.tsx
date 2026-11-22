import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TextField } from "#/components/text-field";
import { Button } from "#/components/ui/button";
import { meQuery } from "#/features/auth/queries";
import { ApiError } from "#/lib/api-error";
import { useUpdateProfile } from "../mutations";
import { profileSchema } from "../schemas";

export function ProfileForm() {
	const { data: user } = useSuspenseQuery(meQuery);
	const updateProfile = useUpdateProfile();

	const form = useForm({
		defaultValues: {
			name: user.name,
			username: user.username,
		},
		validators: {
			onSubmit: profileSchema,
		},
		onSubmit: ({ value }) => {
			updateProfile.mutate(value, {
				onSuccess: (saved) =>
					form.reset({ name: saved.name, username: saved.username }),
			});
		},
	});
	const fieldErrors =
		updateProfile.error instanceof ApiError &&
		updateProfile.error.status === 422
			? updateProfile.error.errors
			: null;

	const formError =
		updateProfile.error && !fieldErrors ? updateProfile.error.message : null;

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

			{updateProfile.isSuccess && (
				<p role="status" className="text-sm">
					Saved.
				</p>
			)}
			<form.Field name="name">
				{(field) => (
					<TextField
						name={field.name}
						label="Name"
						autoComplete="name"
						value={field.state.value}
						error={
							field.state.meta.errors[0]?.message ?? fieldErrors?.name?.[0]
						}
						onChange={field.handleChange}
						onBlur={field.handleBlur}
					/>
				)}
			</form.Field>

			<form.Field name="username">
				{(field) => (
					<TextField
						name={field.name}
						label="Username"
						autoComplete="username"
						value={field.state.value}
						error={
							field.state.meta.errors[0]?.message ?? fieldErrors?.username?.[0]
						}
						onChange={field.handleChange}
						onBlur={field.handleBlur}
					/>
				)}
			</form.Field>

			<Button type="submit" disabled={updateProfile.isPending}>
				{updateProfile.isPending ? "Saving…" : "Save"}
			</Button>
		</form>
	);
}
