import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "#/components/ui/button";
import { useResendVerification } from "../mutations";
import { meQuery } from "../queries";

export function VerifyBanner() {
	const { data: user } = useSuspenseQuery(meQuery);
	const resend = useResendVerification();

	if (user.email_verified_at) return null;

	return (
		<div className="flex flex-wrap items-center gap-3 border-b bg-muted p-3 text-sm">
			<p>Check your email to verify your account.</p>
			<Button
				variant="outline"
				size="sm"
				disabled={resend.isPending}
				onClick={() => resend.mutate()}
			>
				{resend.isPending ? "Sending…" : "Resend email"}
			</Button>
			{resend.data === "sent" && <p>Sent. Check your inbox.</p>}
			{resend.error && (
				<p role="alert" className="text-destructive">
					{resend.error.message}
				</p>
			)}
		</div>
	);
}
