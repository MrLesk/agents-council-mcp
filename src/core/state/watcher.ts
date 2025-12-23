import { mkdirSync, watch } from "node:fs";
import path from "node:path";

import { resolveCouncilStatePath } from "./path";

type WatchOptions = {
  onChange: () => void;
  statePath?: string;
  debounceMs?: number;
};

export type CouncilStateWatcher = {
  close: () => void;
};

const DEFAULT_DEBOUNCE_MS = 50;

export function watchCouncilState(options: WatchOptions): CouncilStateWatcher {
  const statePath = resolveCouncilStatePath(options.statePath);
  const directory = path.dirname(statePath);
  const targetName = path.basename(statePath);
  mkdirSync(directory, { recursive: true });

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const schedule = (): void => {
    if (closed) {
      return;
    }
    if (timeout) {
      clearTimeout(timeout);
    }
    const delay = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    timeout = setTimeout(() => {
      timeout = null;
      try {
        options.onChange();
      } catch {
        // Ignore callback errors to avoid destabilizing the server.
      }
    }, delay);
  };

  const watcher = watch(directory, (event, filename) => {
    if (closed) {
      return;
    }
    const normalized = normalizeFilename(filename);
    if (!normalized) {
      schedule();
      return;
    }
    if (path.basename(normalized) === targetName) {
      schedule();
    }
  });

  watcher.on("error", () => {
    // Avoid unhandled error events from fs.watch.
  });

  return {
    close: () => {
      if (closed) {
        return;
      }
      closed = true;
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      watcher.close();
    },
  };
}

function normalizeFilename(value: string | Buffer | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value : value.toString();
}
