import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { TextField } from "#/components/text-field";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { ApiError } from "#/lib/api-error";
import { useLogin } from "../mutations";
import { safeRedirect } from "../redirect";
import { loginSchema } from "../schemas";

type LoginFormProps = {
	redirect: string | undefined;
};

export function LoginForm({ redirect }: LoginFormProps) {
	const login = useLogin();
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: ({ value }) => {
			login.mutate(value, {
				onSuccess: () =>
					navigate({
						href: safeRedirect(redirect),
					}),
			});
		},
	});
	const fieldErrors =
		login.error instanceof ApiError && login.error.status === 422
			? login.error.errors
			: null;
	const formError = login.error && !fieldErrors ? login.error.message : null;

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

			<form.Field name="password">
				{(field) => {
					const error =
						field.state.meta.errors[0]?.message ?? fieldErrors?.password?.[0];

					return (
						<div className="grid gap-2">
							<Label htmlFor={field.name}>Password</Label>
							<Input
								id={field.name}
								name={field.name}
								type="password"
								autoComplete="current-password"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								aria-invalid={error ? true : undefined}
								aria-describedby={error ? "password-error" : undefined}
							/>
							{error && (
								<p id="password-error" className="text-destructive text-sm">
									{error}
								</p>
							)}
						</div>
					);
				}}
			</form.Field>

			<Button type="submit" disabled={login.isPending}>
				{login.isPending ? "Logging in…" : "Continue"}
			</Button>
		</form>
	);
}
