import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
    </Field>
  );
}

export function AreaField({
  label,
  name,
  defaultValue,
  rows = 5,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <Textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        required={required}
      />
    </Field>
  );
}
