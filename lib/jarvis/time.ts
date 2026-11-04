import { ControlError } from "@/lib/jarvis/errors";

export const MIN_LEAD_MS = 60_000;
export const MAX_AHEAD_MS = 90 * 24 * 3600_000;

/** An explicit time must sit between one minute and 90 days from now. */
export function checkWindow(at: Date, current: Date, field: string): Date {
  const delta = at.getTime() - current.getTime();
  if (delta < MIN_LEAD_MS || delta > MAX_AHEAD_MS) {
    throw new ControlError(
      400,
      "invalid_request",
      `${field} must be between 1 minute and 90 days from now`,
      { field }
    );
  }
  return at;
}
