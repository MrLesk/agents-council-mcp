import { homedir } from "node:os";
import path from "node:path";

export function resolveCouncilStatePath(statePath?: string): string {
  const trimmed = statePath?.trim();
  if (trimmed) {
    return normalizePath(trimmed);
  }

  const override = process.env.AGENTS_COUNCIL_STATE_PATH?.trim();
  if (override) {
    return normalizePath(override);
  }

  return path.join(homedir(), ".agents-council", "state.json");
}

export function normalizePath(input: string): string {
  if (input === "~") {
    return homedir();
  }

  if (input.startsWith("~/")) {
    return path.join(homedir(), input.slice(2));
  }

  return path.resolve(input);
}
