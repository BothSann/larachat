const FALLBACK = "/chats";

export function safeRedirect(target: string | undefined): string {
	if (!target?.startsWith("/")) return FALLBACK;
	if (target.startsWith("//") || target.startsWith("/\\")) return FALLBACK;

	return target;
}
