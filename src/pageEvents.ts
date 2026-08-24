// Public surface for LP → commercial-api page events (funnel + diagnostics).
//
// Central entry: trackPageEvent / trackCtaClick. Context (visitor, session,
// UTMs, device, experiments, page_version) is attached here so call sites only
// pass event-specific properties — never PII.

import { getSessionId } from "./sessionId.js";
import { getAdId, getUtmParams } from "./utmParams.js";
import { getVisitorId } from "./visitorId.js";

import { getTrackingConfig } from "./config.js";

/**
 * Playbook + diagnostic names. Names outside this list are dropped by the API;
 * keeping the union here stops a typo from silently vanishing into the void.
 *
 * Do not rename hero_cta_click / form_submit: the dashboard aggregates those.
 */
export type PageEventName =
  | "page_view"
  | "hero_cta_click"
  | "cta_click"
  | "form_start"
  | "form_error"
  | "form_submit"
  | "form_submit_success"
  | "form_submit_attempt"
  | "form_submit_error"
  | "form_abandon"
  | "form_step_view"
  | "whatsapp_click"
  | "schedule_complete";

export type CtaLocation =
  | "header"
  | "hero"
  | "middle"
  | "features"
  | "social_proof"
  | "pricing"
  | "faq"
  | "final"
  | "floating"
  | "menu";

export type CtaType =
  | "primary"
  | "secondary"
  | "whatsapp"
  | "form_anchor"
  | "external_link"
  | "schedule";

export type CtaDestination =
  | "form"
  | "whatsapp"
  | "scheduling"
  | "external_url"
  | "internal_section";

export type CtaClickProps = {
  cta_id: string;
  cta_location: CtaLocation;
  cta_text: string;
  cta_type: CtaType;
  cta_destination: CtaDestination;
  form_id?: string;
};

type PageEventPayload = {
  name: PageEventName;
  occurred_at?: string;
  properties?: Record<string, unknown>;
};

function deviceType(): string {
  if (matchMedia("(max-width: 768px)").matches) {
    return "mobile";
  }
  if (matchMedia("(max-width: 1024px)").matches) {
    return "tablet";
  }
  return "desktop";
}

function releaseSha(): string {
  return typeof getTrackingConfig().releaseSha === "string" ? getTrackingConfig().releaseSha : "";
}

/** Best-effort Clarity custom event; never throws into the UI path. */
function mirrorClarityEvent(name: string): void {
  try {
    window.clarity?.("event", name);
  } catch {
    // Clarity blocked or not loaded
  }
}

function mirrorClarityTags(experimentId: string, variant: string): void {
  try {
    if (experimentId && variant) {
      window.clarity?.("set", `exp_${experimentId}`, variant);
    }
    const version = releaseSha();
    if (version) {
      window.clarity?.("set", "lp_version", version);
    }
  } catch {
    // ignore
  }
}

const CLARITY_MIRROR: Partial<Record<PageEventName, boolean>> = {
  form_start: true,
  form_error: true,
  form_submit: true,
  form_submit_success: true,
  form_abandon: true,
  cta_click: true,
  hero_cta_click: true,
};

/**
 * Fire-and-forget POST. Never awaited on a UI path: a failure here must not
 * block navigation, form submit, or the WhatsApp click. `keepalive` keeps the
 * request alive across the thank-you redirect the same way exposure reporting
 * survives a page unload.
 */
function sendEvents(
  events: PageEventPayload[],
  experiment?: { experiment_id: string; variant: string },
): void {
  if (events.length === 0) {
    return;
  }

  const utm = getUtmParams();
  // One event can be evidence for every test active on that page. The API
  // stores one experiment per row, so send the same event once per assignment
  // rather than hardcoding the hero test and silently losing future tests.
  const contexts = experiment
    ? [experiment]
    : Object.entries(getTrackingConfig().getAssignments()).map(([experiment_id, variant]) => ({
        experiment_id,
        variant,
      }));
  if (contexts.length === 0) {
    contexts.push({ experiment_id: "", variant: "" });
  }

  const occurredAt = new Date().toISOString();
  const common = {
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
    page: location.pathname || "/",
    page_version: releaseSha(),
    device: deviceType(),
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_content: utm.utm_content,
    ad_id: getAdId(),
    events: events.map((event) => ({
      name: event.name,
      occurred_at: event.occurred_at ?? occurredAt,
      ...(event.properties ? { properties: event.properties } : {}),
    })),
  };

  for (const ctx of contexts) {
    mirrorClarityTags(ctx.experiment_id, ctx.variant);
    const body = JSON.stringify({ ...common, ...ctx });
    // Prefer sendBeacon on unload paths: keepalive fetch is often cancelled
    // when the tab closes, which silently drops form_abandon.
    let sent = false;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        sent = navigator.sendBeacon(
          getTrackingConfig().eventsPath,
          new Blob([body], { type: "application/json" }),
        );
      }
    } catch {
      sent = false;
    }
    if (!sent) {
      void fetch(getTrackingConfig().eventsPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Best-effort: dropping an event understates a diagnostic, it must never
        // surface to the visitor.
      });
    }
  }

  for (const event of events) {
    if (CLARITY_MIRROR[event.name]) {
      mirrorClarityEvent(event.name);
    }
  }
}

/** Record one interaction. Safe to call from click / focus / submit handlers. */
export function trackPageEvent(
  name: PageEventName,
  properties?: Record<string, unknown>,
  experiment?: { experiment_id: string; variant: string },
): void {
  sendEvents(
    [{ name, ...(properties ? { properties } : {}) }],
    experiment,
  );
  espelhar(name, properties ?? {});
}

/**
 * Repassa o evento ao espelho configurado, se houver.
 *
 * Depois do envio nosso e nunca antes: o espelho é de terceiro, e um script que
 * demora ou lança não pode atrasar nem impedir a medição que sustenta os
 * relatórios. Por isso também o try/catch — o pior caso é o espelho perder um
 * evento, não a página perder todos.
 */
function espelhar(name: string, properties: Record<string, unknown>): void {
  const { onEvent } = getTrackingConfig();
  if (!onEvent) return;
  try {
    onEvent(name, properties);
  } catch {
    // ignorado de propósito: ver acima
  }
}

/**
 * Generic CTA click. Hero also dual-writes legacy `hero_cta_click` so the
 * dashboard CTA column keeps working without a SQL rename.
 */
export function trackCtaClick(props: CtaClickProps): void {
  const properties: Record<string, unknown> = {
    cta_id: props.cta_id,
    cta_location: props.cta_location,
    cta_text: props.cta_text,
    cta_type: props.cta_type,
    cta_destination: props.cta_destination,
  };
  if (props.form_id) {
    properties.form_id = props.form_id;
  }

  trackPageEvent("cta_click", properties);

  if (props.cta_id === "hero-primary") {
    trackPageEvent("hero_cta_click");
  }
}

let pageViewSent = false;

/**
 * One `page_view` per load of the **landing** page. Thank-you fires its own
 * page_view from the React tree (it already knows the thank-you variant);
 * privacy routes are not part of the conversion funnel.
 */
export function initPageEvents(): void {
  if (pageViewSent) {
    return;
  }

  const path = location.pathname.replace(/\/$/, "") || "/";
  if (path !== "/") {
    return;
  }

  pageViewSent = true;
  // Warm attribution stores from the landing URL before the first beacon.
  getUtmParams();
  getAdId();
  getSessionId();
  trackPageEvent("page_view");
}
