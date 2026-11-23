import { Link } from "@tanstack/react-router";

export function BrokenResetLink() {
	return (
		<div role="alert" className="grid max-w-sm gap-2 text-sm">
			<p>This reset link is broken or expired.</p>
			<Link to="/forgot-password" className="justify-self-start underline">
				Get a new link
			</Link>
		</div>
	);
}
