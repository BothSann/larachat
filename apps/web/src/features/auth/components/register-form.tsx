import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { TextField } from "#/components/text-field";
import { Button } from "#/components/ui/button";
import { ApiError } from "#/lib/api-error";
import { useRegister } from "../mutations";
import { safeRedirect } from "../redirect";
import { registerSchema } from "../schemas";

type RegisterFormProps = {
	redirect: string | undefined;
};

export function RegisterForm({ redirect }: RegisterFormProps) {
	const register = useRegister();
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			name: "",
			username: "",
			email: "",
			password: "",
			password_confirmation: "",
		},
		validators: {
			onSubmit: registerSchema,
		},
		onSubmit: ({ value }) => {
			register.mutate(value, {
				onSuccess: () =>
					navigate({
						href: safeRedirect(redirect),
					}),
			});
		},
	});
	const fieldErrors =
		register.error instanceof ApiError && register.error.status === 422
			? register.error.errors
			: null;
	const formError =
		register.error && !fieldErrors ? register.error.message : null;

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

			<form.Field name="password">
				{(field) => (
					<TextField
						name={field.name}
						label="Password"
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

			<Button type="submit" disabled={register.isPending}>
				{register.isPending ? "Creating account…" : "Create account"}
			</Button>
		</form>
	);
}
