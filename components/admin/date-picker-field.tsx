"use client";

import { useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Field } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function parseDate(value?: string) {
  if (!value?.trim()) return undefined;
  const formats = ["MMMM d, yyyy", "MMM d, yyyy", "yyyy-MM-dd", "d MMMM yyyy"];
  for (const pattern of formats) {
    const parsed = parse(value.trim(), pattern, new Date());
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const native = new Date(value);
  return Number.isNaN(native.getTime()) ? undefined : native;
}

export function DatePickerField({
  name,
  label,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
}) {
  const initial = useMemo(() => parseDate(defaultValue), [defaultValue]);
  const [date, setDate] = useState<Date | undefined>(initial);
  const display = date ? format(date, "MMMM d, yyyy") : "";

  return (
    <Field label={label} htmlFor={name} hint={hint}>
      <input type="hidden" name={name} value={display} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full justify-start border-hairline-strong bg-white px-3 font-normal text-ink shadow-none hover:translate-y-0 hover:bg-white"
          >
            <CalendarDays className="h-4 w-4 text-pine" />
            {display || <span className="text-muted-2">Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
