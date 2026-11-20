import { z } from "zod";

export const guestSearchSchema = z.object({
	redirect: z.string().optional().catch(undefined),
});
