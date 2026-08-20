"use client";

import { useState } from "react";
import { Field } from "@/components/admin/fields";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectField({
  name,
  label,
  hint,
  defaultValue,
  options,
  placeholder = "Select",
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <input type="hidden" name={name} value={value} />
      <Select value={value || undefined} onValueChange={setValue}>
        <SelectTrigger id={name}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function SwitchField({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(Boolean(defaultChecked));

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-hairline-strong bg-white px-4 py-3">
      <input type="hidden" name={name} value={checked ? "on" : ""} />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>
        ) : null}
      </span>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </label>
  );
}
