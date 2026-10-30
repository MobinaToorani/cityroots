import { useId, type ComponentProps } from "react";
import { describedBy, fieldControlClasses } from "./field-parts";
import { FieldMessages } from "./field-messages";
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
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="relative">
        <input
          id={id}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, description, error)}
          className={fieldControlClasses(error, "h-14 pt-5 pb-1.5")}
          {...props}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-1/2 left-4 origin-left -translate-y-1/2 text-body text-text-muted transition-all duration-150 ease-[var(--ease-out-expo)] peer-not-placeholder-shown:top-3.5 peer-not-placeholder-shown:text-[11px] peer-not-placeholder-shown:font-semibold peer-focus:top-3.5 peer-focus:text-[11px] peer-focus:font-semibold"
        >
          {label}
        </label>
      </div>
      <FieldMessages id={id} description={description} error={error} />
    </div>
  );
}
