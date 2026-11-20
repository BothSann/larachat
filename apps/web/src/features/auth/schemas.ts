import { z } from "zod";

export const guestSearchSchema = z.object({
	redirect: z.string().optional().catch(undefined),
});

export const loginSchema = z.object({
	email: z.email("Enter a valid email address."),
	password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
	.object({
		name: z.string().min(1, "Enter your name."),
		username: z.string().min(1, "Choose a username."),
		email: z.email("Enter a valid email address."),
		password: z.string().min(8, "Use at least 8 characters."),
		password_confirmation: z.string(),
	})
	.refine((data) => data.password === data.password_confirmation, {
		error: "Passwords don't match.",
		path: ["password_confirmation"],
	});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
