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
export { configureTracking, getTrackingConfig } from "./config";
export { getVisitorId } from "./visitorId";
export { getSessionId } from "./sessionId";
export { getUtmParams, getAdId } from "./utmParams";
export { analyticsFormId, classifyFormError, classifyAllFormErrors, controlHasValue, fieldIdFromElement, formStepProps, resolveFrictionField, FORM_FIELD_ORDER, } from "./formTracking";
export { trackPageEvent, trackCtaClick, initPageEvents } from "./pageEvents";
export { trackCtaFromElement } from "./ctaFromElement";
