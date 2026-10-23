import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Labelled text input used across the staff dashboard forms. */
export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null | undefined;
  type?: string | undefined;
  required?: boolean | undefined;
  placeholder?: string | undefined;
  hint?: string | undefined;
  min?: string | number;
  max?: string | number;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        min={min}
        max={max}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="mt-2"
      />
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null | undefined;
  rows?: number | undefined;
  placeholder?: string | undefined;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="mt-2"
      />
    </div>
  );
}

export function PanelIntro({ children }: { children: ReactNode }) {
  return <p className="mb-6 max-w-2xl text-sm text-muted-foreground">{children}</p>;
}
