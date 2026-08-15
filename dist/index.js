/**
 * Shared tracking for every EscalaSaaS landing page.
 *
 * Extracted from the escalasaas-lp repository so a correction lands once
 * instead of N times. The three bugs found on 07/08/2026 — selects invisible to
 * the tracker, form_start firing on the privacy link, and friction resolved
 * from the wrong field — each existed in one site. Copied into ten, they would
 * have been ten fixes, applied unevenly, leaving the sites' reports no longer
 * comparable with one another.
 */
export { configureTracking, getTrackingConfig } from "./config.js";
export { getVisitorId } from "./visitorId.js";
export { getSessionId } from "./sessionId.js";
export { getUtmParams, getAdId } from "./utmParams.js";
export { analyticsFormId, classifyFormError, classifyAllFormErrors, controlHasValue, fieldIdFromElement, formStepProps, resolveFrictionField, FORM_FIELD_ORDER, } from "./formTracking.js";
export { trackPageEvent, trackCtaClick, initPageEvents } from "./pageEvents.js";
export { trackCtaFromElement } from "./ctaFromElement.js";
import { initCtaTracking } from "./ctaFromElement.js";
import { initPageEvents } from "./pageEvents.js";
export { initCtaTracking };
/**
 * Liga tudo o que uma landing page precisa: o page_view e o registro de
 * cliques em CTA.
 *
 * Existe para a LP ter uma linha só. Chamar as duas separadamente funciona
 * igual — e é o que fazer quando uma página quiser o page_view sem o resto.
 */
export function initTracking() {
    initPageEvents();
    initCtaTracking();
}
export { attachFormTracking, trackFormAttempt, trackFormError, trackFormSuccess, trackFormSubmitError, } from "./attachForm.js";
