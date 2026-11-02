type Level = "debug" | "info" | "warn" | "error";

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  const raw = process.env.LOG_LEVEL;
  return raw && raw in order ? order[raw as Level] : order.info;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack, cause: err.cause };
  }
  return { value: String(err) };
}

function write(level: Level, message: string, context?: Record<string, unknown>) {
  if (order[level] < threshold()) return;
  const entry: Record<string, unknown> = { level, message, time: new Date().toISOString() };
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      entry[key] = value instanceof Error ? serializeError(value) : value;
    }
  }
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

/** The single logger for shipped code. Nothing else writes to the console. */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => write("error", message, context),
};
