/** Typed application errors. Route boundaries turn these into friendly states. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: "not_found" | "unauthorized" | "forbidden" | "invalid_input" | "unavailable",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AppError";
  }
}

export class DataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DataError";
  }
}
