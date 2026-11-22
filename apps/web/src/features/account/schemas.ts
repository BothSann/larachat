import { z } from "zod";

export const profileSchema = z.object({
	name: z.string().min(1, "Enter your name."),
	username: z.string().min(1, "Choose a username."),
});

export type ProfileInput = z.infer<typeof profileSchema>;
