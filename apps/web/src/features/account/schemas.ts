import { z } from "zod";

export const profileSchema = z.object({
	name: z.string().min(1, "Enter your name."),
	username: z.string().min(1, "Choose a username."),
});

export const changePasswordSchema = z
	.object({
		current_password: z.string().min(1, "Enter your current password."),
		password: z.string().min(8, "Use at least 8 characters."),
		password_confirmation: z.string(),
	})
	.refine((data) => data.password === data.password_confirmation, {
		error: "Passwords don't match.",
		path: ["password_confirmation"],
	});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
