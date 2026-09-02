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
  value: valueProp,
  onValueChange,
  options,
  placeholder = "Select",
  disabled,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : internal;

  function handleChange(next: string) {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <input type="hidden" name={name} value={value} />
      <Select
        value={value || undefined}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger id={name}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value || "empty"} value={option.value || "__auto__"}>
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
  checked: checkedProp,
  onCheckedChange,
  disabled,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const [internal, setInternal] = useState(Boolean(defaultChecked));
  const controlled = checkedProp !== undefined;
  const checked = controlled ? checkedProp : internal;

  function handleChange(next: boolean) {
    if (!controlled) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-hairline-strong bg-white px-4 py-3">
      <input type="hidden" name={name} value={checked ? "on" : ""} />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>
        ) : null}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
