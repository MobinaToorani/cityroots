import { useId } from "react";
import { FieldMessages } from "./field-messages";
import { cn } from "@/lib/cn";

type ChoiceChipsProps = {
  legend: string;
  name: string;
  options: readonly { value: string; label: string; accent?: string }[];
  defaultValue?: string | readonly string[];
  /** Checkboxes instead of radios, for picking any number. */
  multiple?: boolean;
  required?: boolean;
  description?: string;
  error?: string;
};

/** Single choice (or several, with `multiple`) shown as chips. Real radio inputs, so it works without JavaScript. */
export function ChoiceChips({
  legend,
  name,
  options,
  defaultValue,
  multiple = false,
  required,
  description,
  error,
}: ChoiceChipsProps) {
  const id = useId();
  const ids = [description ? `${id}-description` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <fieldset
      className="grid gap-2"
      aria-describedby={ids || undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-2 px-1 text-meta font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={o.value}
              defaultChecked={
                Array.isArray(defaultValue)
                  ? defaultValue.includes(o.value)
                  : defaultValue === o.value
              }
              required={required}
              className="peer sr-only"
            />
            <span
              className={cn(
                "motion-press inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-meta font-medium transition-colors duration-150",
                "border-divider bg-surface-solid hover:border-text-muted",
                "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-on-ink",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus",
              )}
            >
              {o.accent && (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: o.accent }}
                />
              )}
              {o.label}
            </span>
          </label>
        ))}
      </div>
      <FieldMessages id={id} description={description} error={error} />
    </fieldset>
  );
}
