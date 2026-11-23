import { ApiError } from "#/lib/api-error";

export function formErrorText(error: Error | null): string | null {
	if (!error) return null;
	if (error instanceof ApiError && error.status === 422) return null;
	if (error instanceof ApiError && error.status === 429) {
		return "Too many tries. Wait a minute and try again.";
	}

	return error.message;
}
