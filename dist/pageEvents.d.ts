/**
 * Playbook + diagnostic names. Names outside this list are dropped by the API;
 * keeping the union here stops a typo from silently vanishing into the void.
 *
 * Do not rename hero_cta_click / form_submit: the dashboard aggregates those.
 */
export type PageEventName = "page_view" | "hero_cta_click" | "cta_click" | "form_start" | "form_error" | "form_submit" | "form_submit_success" | "form_submit_attempt" | "form_submit_error" | "form_abandon" | "form_step_view" | "whatsapp_click" | "schedule_complete";
export type CtaLocation = "header" | "hero" | "middle" | "features" | "social_proof" | "pricing" | "faq" | "final" | "floating" | "menu";
export type CtaType = "primary" | "secondary" | "whatsapp" | "form_anchor" | "external_link" | "schedule";
export type CtaDestination = "form" | "whatsapp" | "scheduling" | "external_url" | "internal_section";
export type CtaClickProps = {
    cta_id: string;
    cta_location: CtaLocation;
    cta_text: string;
    cta_type: CtaType;
    cta_destination: CtaDestination;
    form_id?: string;
};
/** Record one interaction. Safe to call from click / focus / submit handlers. */
export declare function trackPageEvent(name: PageEventName, properties?: Record<string, unknown>, experiment?: {
    experiment_id: string;
    variant: string;
}): void;
/**
 * Generic CTA click. Hero also dual-writes legacy `hero_cta_click` so the
 * dashboard CTA column keeps working without a SQL rename.
 */
export declare function trackCtaClick(props: CtaClickProps): void;
/**
 * One `page_view` per load of the **landing** page. Thank-you fires its own
 * page_view from the React tree (it already knows the thank-you variant);
 * privacy routes are not part of the conversion funnel.
 */
export declare function initPageEvents(): void;
