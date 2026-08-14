declare const UTM_KEYS: readonly ["utm_medium", "utm_source", "utm_id", "utm_content", "utm_term", "utm_campaign"];
export type UtmParams = Record<(typeof UTM_KEYS)[number], string>;
/**
 * Merge URL UTMs into the session store without wiping a known value with "".
 * First non-empty touch wins per key for the life of the tab session unless a
 * later URL brings a new non-empty value for that key (last non-empty wins).
 */
export declare function getUtmParams(): UtmParams;
/**
 * Explicit campaign ad id from the URL (`ad_id=…`). Never inferred from
 * utm_content. Persists for the tab; blank URL does not clear a stored value.
 */
export declare function getAdId(): string;
export {};
