import { useId } from "react";
import type { CategorySlug } from "@/lib/domain/categories";
import { CategoryIcon } from "./category-icon";
import { FieldMessages } from "./field-messages";
import { cn } from "@/lib/cn";

type ChoiceChipsProps = {
  legend: string;
  name: string;
  options: readonly { value: string; label: string; category?: CategorySlug }[];
  defaultValue?: string | readonly string[];
  /** Equal widths on one line, for a short set of short labels like prices. */
  even?: boolean;
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
  even = false,
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
      <legend className="mb-2 text-meta font-semibold">{legend}</legend>
      <div
        className={even ? "grid max-w-sm auto-cols-fr grid-flow-col gap-2" : "flex flex-wrap gap-2"}
      >
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
                "motion-press touch-target inline-flex h-9 cursor-pointer items-center gap-2 rounded-control border text-meta font-medium transition-colors duration-200",
                even ? "w-full justify-center px-1" : "px-3.5",
                "border-divider bg-surface-solid hover:border-text-muted/40 hover:bg-sand/60",
                "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-on-ink peer-checked:[&_svg]:!text-on-ink",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-focus",
              )}
            >
              {o.category && <CategoryIcon slug={o.category} size={16} />}
              {o.label}
            </span>
          </label>
        ))}
      </div>
      <FieldMessages id={id} description={description} error={error} />
    </fieldset>
  );
}
