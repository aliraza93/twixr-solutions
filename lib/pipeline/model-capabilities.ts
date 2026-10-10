/**
 * Per-model API capabilities.
 *
 * The pipeline rotates between models so the prose texture varies, which means
 * one request shape cannot be assumed. Three things differ across the current
 * generation and will fail a request outright if got wrong:
 *
 * - Forced tool use (`tool_choice: {type: "tool"|"any"}`) returns 400 on
 *   Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1. Those models need
 *   `tool_choice: auto` plus an explicit instruction naming the tool.
 * - `temperature` is removed (400) on Fable 5/5.1, Opus 5.5/5/4.8/4.7 and
 *   Sonnet 5, and rejects non-default values on Sonnet 5.5 and Haiku 5.5.
 * - `output_config.effort` is supported from the 4.6 generation onward and
 *   errors on Sonnet 4.5 / Haiku 4.5.
 *
 * Effort is the replacement texture lever where temperature is unavailable: it
 * changes how much the model deliberates, which shows up in the writing.
 */

export type ModelCaps = {
  /** Safe to pass tool_choice: { type: "tool", name } */
  forcedToolChoice: boolean;
  /** Safe to pass a non-default temperature */
  temperature: boolean;
  /** Safe to pass output_config.effort */
  effort: boolean;
};

/** Models that reject forced tool_choice. Matched as a prefix. */
const NO_FORCED_TOOL = [
  "claude-fable-5-1",
  "claude-mythos-5-1",
  "claude-opus-5-5",
  "claude-sonnet-5-5",
];

/** Models that reject a non-default temperature. Matched as a prefix. */
const NO_TEMPERATURE = [
  "claude-fable-5",
  "claude-mythos-5",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-sonnet-5-5",
  "claude-sonnet-5",
  "claude-haiku-5-5",
];

/** Models that reject output_config.effort. Matched as a prefix. */
const NO_EFFORT = ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"];

function matches(model: string, list: string[]): boolean {
  const id = model.trim().toLowerCase();
  return list.some((prefix) => id.startsWith(prefix));
}

export function capsFor(model: string): ModelCaps {
  return {
    forcedToolChoice: !matches(model, NO_FORCED_TOOL),
    temperature: !matches(model, NO_TEMPERATURE),
    effort: !matches(model, NO_EFFORT),
  };
}
