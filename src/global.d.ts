/**
 * Clarity's snippet defines this on window when it loads. Declared here rather
 * than imported because the package must work on a page where Clarity is
 * blocked or absent — every call site already guards with `?.` and try/catch.
 */
declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export {};
