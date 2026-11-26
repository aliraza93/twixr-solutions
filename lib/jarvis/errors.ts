export type ControlErrorCode =
  | "disabled"
  | "unauthorized"
  | "rate_limited"
  | "invalid_json"
  | "payload_too_large"
  | "invalid_request"
  | "not_found"
  | "invalid_transition"
  | "duplicate"
  | "linked_social"
  | "conflict"
  | "quality_gate"
  | "override_required"
  | "idempotency_mismatch"
  | "generator_mismatch"
  | "daily_cap"
  | "internal";

export class ControlError extends Error {
  constructor(
    readonly status: number,
    readonly code: ControlErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ControlError";
  }
}
