import { z } from "zod";

export const guestSearchSchema = z.object({
	redirect: z.string().optional().catch(undefined),
});

export const loginSchema = z.object({
	email: z.email("Enter a valid email address."),
	password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;
