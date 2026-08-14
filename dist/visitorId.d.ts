/**
 * Returns this browser's visitor id, creating and persisting one on first call.
 * Falls back to a per-session id when storage is blocked (private browsing), so
 * the caller always gets a usable value.
 */
export declare function getVisitorId(): string;
