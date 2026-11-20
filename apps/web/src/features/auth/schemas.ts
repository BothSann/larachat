import { z } from "zod";

export const guestSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const loginScheman = z.object({
  email: z.email("Enter a valid email address."),
  password: 
});
