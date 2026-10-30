import { useId, type ComponentProps } from "react";
import { describedBy, fieldControlClasses, floatingLabelClasses } from "./field-parts";
import { FieldMessages } from "./field-messages";
import { cn } from "@/lib/cn";

type TextareaFieldProps = Omit<ComponentProps<"textarea">, "id" | "placeholder"> & {
  label: string;
  description?: string;
  error?: string;
};

export function TextareaField({
  label,
  description,
  error,
  className,
  rows = 4,
  ...props
}: TextareaFieldProps) {
  const id = useId();
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="relative">
        <textarea
          id={id}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, description, error)}
          className={fieldControlClasses(error, "resize-y pt-7 pb-3 leading-relaxed")}
          {...props}
        />
        <label htmlFor={id} className={floatingLabelClasses}>
          {label}
        </label>
      </div>
      <FieldMessages id={id} description={description} error={error} />
    </div>
  );
}
