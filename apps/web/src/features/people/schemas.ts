import { z } from "zod";

export const MIN_SEARCH_LENGTH = 2;

export function normalizeSearch(text: string): string {
	return text.trim().toLowerCase().replace(/^@/, "");
}

export const peopleSearchSchema = z.object({
	q: z
		.union([z.string(), z.number().transform(String)])
		.transform((text) => normalizeSearch(text) || undefined)
		.optional()
		.catch(undefined),
});
