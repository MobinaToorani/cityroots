import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = Omit<ComponentProps<"input">, "id" | "placeholder"> & {
  label: string;
  description?: string;
  error?: string;
};

/**
 * Text input with a floating label, a description, and inline validation,
 * all wired through aria-describedby.
 */
export function TextField({ label, description, error, className, ...props }: TextFieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
          className={cn(
            "peer h-14 w-full rounded-2xl border bg-surface-solid px-4 pt-5 pb-1.5 text-body text-text transition-colors outline-none",
            "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus",
            error ? "border-danger" : "border-divider hover:border-text-muted",
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-1/2 left-4 origin-left -translate-y-1/2 text-body text-text-muted transition-all duration-150 ease-[var(--ease-out-expo)] peer-not-placeholder-shown:top-3.5 peer-not-placeholder-shown:text-[11px] peer-not-placeholder-shown:font-semibold peer-focus:top-3.5 peer-focus:text-[11px] peer-focus:font-semibold"
        >
          {label}
        </label>
      </div>
      {description && (
        <p id={descriptionId} className="px-1 text-meta text-text-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="px-1 text-meta font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
