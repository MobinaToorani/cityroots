import { ChevronDown } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { describedBy, fieldControlClasses, floatingLabelClasses } from "./field-parts";
import { FieldMessages } from "./field-messages";
import { Icon } from "./icon";
import { cn } from "@/lib/cn";

type SelectFieldProps = Omit<ComponentProps<"select">, "id"> & {
  label: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  error?: string;
};

/** Native select with the floating-label look. Works without JavaScript. */
export function SelectField({
  label,
  options,
  placeholder,
  description,
  error,
  className,
  ...props
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, description, error)}
          className={fieldControlClasses(error, "h-14 appearance-none pt-5 pr-10 pb-1.5")}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label htmlFor={id} className={floatingLabelClasses}>
          {label}
        </label>
        <Icon
          icon={ChevronDown}
          size={16}
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted"
        />
      </div>
      <FieldMessages id={id} description={description} error={error} />
    </div>
  );
}
