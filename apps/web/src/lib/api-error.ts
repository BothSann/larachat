type ErrorBody = {
	message?: string;
	errors?: Record<string, string[]>;
	code?: string;
};

export class ApiError extends Error {
	readonly status: number;
	readonly errors: Record<string, string[]>;
	readonly code: string | undefined;

	constructor(status: number, body: ErrorBody) {
		super(body.message ?? `Request failed with status ${status}`);
		this.name = "ApiError";
		this.status = status;
		this.errors = body.errors ?? {};
		this.code = body.code;
	}

	static async from(response: Response): Promise<ApiError> {
		const body = await response
			.clone()
			.json()
			.catch(() => ({}));
		return new ApiError(response.status, body);
	}
}
