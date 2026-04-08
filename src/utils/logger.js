/**
 * ─────────────────────────────────────────────────────────────────
 *  LOGGER  (lightweight, no external dependencies)
 *  Uses console with timestamps and colour-coded level prefixes.
 *  Drop-in replacement for winston/pino if you add them later.
 * ─────────────────────────────────────────────────────────────────
 */

const levels = {
  info:  '\x1b[36m[INFO] \x1b[0m',   // cyan
  warn:  '\x1b[33m[WARN] \x1b[0m',   // yellow
  error: '\x1b[31m[ERROR]\x1b[0m',   // red
  debug: '\x1b[35m[DEBUG]\x1b[0m',   // magenta
};

const stamp = () => new Date().toISOString();

export const logger = {
  info:  (msg, ...args) => console.log(`${stamp()} ${levels.info}`, msg, ...args),
  warn:  (msg, ...args) => console.warn(`${stamp()} ${levels.warn}`, msg, ...args),
  error: (msg, ...args) => console.error(`${stamp()} ${levels.error}`, msg, ...args),
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${stamp()} ${levels.debug}`, msg, ...args);
    }
  },
};
