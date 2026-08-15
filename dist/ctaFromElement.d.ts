/**
 * Call from the shared button component's onClick.
 *
 * Never throws and never blocks: a CTA that fails to report must still
 * navigate. `data-cta-id` on the element overrides the derived id, for the
 * rare button whose text changes but whose identity should not.
 */
export declare function trackCtaFromElement(el: HTMLElement): void;
