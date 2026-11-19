// Test helpers that fake the browser cookie jar (jsdom's document.cookie).

export function setCookie(name: string, value: string) {
	// biome-ignore lint/suspicious/noDocumentCookie: tests fake the cookie Laravel would set
	document.cookie = `${name}=${value}`;
}

export function clearCookie(name: string) {
	// biome-ignore lint/suspicious/noDocumentCookie: tests fake the cookie Laravel would clear
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
