/** Shared motion tokens — docs/design.md §5 */

export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
export const EASE_INOUT = "cubic-bezier(0.65, 0.05, 0.36, 1)";
export const MOTION_EASE = [0.22, 1, 0.36, 1] as const;

/** Primary scroll-reveal duration (seconds) */
export const DURATION = 0.8;
export const DURATION_FAST = 0.2;
export const DURATION_BASE = 0.4;
export const DURATION_SLOW = 0.8;

/** Per-item stagger for reveal groups (seconds) */
export const STAGGER = 0.07;

export const REVEAL_DISTANCE = 24;
