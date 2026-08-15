import { trackCtaClick } from "./pageEvents";
import type { CtaDestination, CtaLocation, CtaType } from "./pageEvents";

/**
 * Derives a CTA event from the clicked element instead of asking every call
 * site to describe itself.
 *
 * The alternative — five props on every button in every landing page — is the
 * kind of chore that gets half-done: some buttons carry a location, others
 * don't, and the CTA report shows a distribution of whoever remembered. Here
 * the page needs one line in its shared button component and every CTA in it
 * is covered, including ones added later.
 *
 * Everything is read at click time from the DOM the visitor actually saw.
 */

/**
 * Section id → the location vocabulary the report groups by.
 *
 * Matching is by substring so a page calling its section `funcionalidades` and
 * another calling it `features` land in the same bucket, which is the whole
 * point of a shared vocabulary.
 */
const LOCATION_BY_SECTION: [test: string, location: CtaLocation][] = [
  ["hero", "hero"],
  ["header", "header"],
  ["menu", "menu"],
  ["funcionalidade", "features"],
  ["feature", "features"],
  ["sistema", "features"],
  ["como-funciona", "middle"],
  ["problema", "middle"],
  ["solucao", "middle"],
  ["resultado", "social_proof"],
  ["prova", "social_proof"],
  ["depoimento", "social_proof"],
  ["experiencia", "social_proof"],
  ["preco", "pricing"],
  ["plano", "pricing"],
  ["pricing", "pricing"],
  ["pergunta", "faq"],
  ["faq", "faq"],
  ["contato", "final"],
  ["cta", "final"],
];

/** The section a CTA sits in, and where it falls in the page. */
function sectionOf(el: Element): { section: HTMLElement | null; index: number } {
  const section = el.closest<HTMLElement>("section");
  if (!section) return { section: null, index: -1 };
  const all = Array.from(document.querySelectorAll("section"));
  return { section, index: all.indexOf(section) };
}

function locationOf(el: Element, section: HTMLElement | null, index: number): CtaLocation {
  if (el.closest("header")) return "header";
  if (el.closest("[data-cta-floating]")) return "floating";

  const id = (section?.id ?? "").toLowerCase();
  for (const [test, location] of LOCATION_BY_SECTION) {
    if (id.includes(test)) return location;
  }

  // No id to go by. The first section of a landing page is the hero in every
  // template we ship, and calling the hero CTA "middle" would bury the single
  // most important button in the report.
  if (index === 0) return "hero";

  // "middle" is the honest bucket for the rest: it says "somewhere in the
  // body", which is true, instead of inventing a section that does not exist.
  return "middle";
}

function destinationOf(href: string | null, isSubmit: boolean): CtaDestination {
  if (isSubmit) return "form";
  if (!href) return "internal_section";
  if (href.includes("wa.me") || href.includes("whatsapp")) return "whatsapp";
  if (href.includes("calendly") || href.includes("cal.com")) return "scheduling";
  if (href.startsWith("#")) return "internal_section";
  if (href.startsWith("http")) return "external_url";
  return "internal_section";
}

function typeOf(destination: CtaDestination, isPrimary: boolean): CtaType {
  if (destination === "whatsapp") return "whatsapp";
  if (destination === "scheduling") return "schedule";
  if (destination === "external_url") return "external_link";
  if (destination === "form") return "form_anchor";
  return isPrimary ? "primary" : "secondary";
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/**
 * Short, readable in a report, and \u2014 the part that matters \u2014 different for
 * each button.
 *
 * A page usually repeats the same CTA text five or six times down the page. If
 * the id were only location plus text, all of them would collapse into one row
 * and the report could not say which position converts, which is the one
 * question the CTA table exists to answer.
 *
 * The section's own id is the stable discriminator. Where there is none, the
 * section's position stands in: it is stable while the page's structure is,
 * and giving the section an id upgrades it without changing anything else.
 */
function idFrom(
  location: string,
  text: string,
  section: HTMLElement | null,
  index: number,
): string {
  const parts = [location];
  const sectionID = section?.id ?? "";
  if (!sectionID && index > 0) parts.push(`s${index + 1}`);

  const slug = slugify(text);
  if (slug) parts.push(slug);
  return parts.join("-");
}

/**
 * Call from the shared button component's onClick.
 *
 * Never throws and never blocks: a CTA that fails to report must still
 * navigate. `data-cta-id` on the element overrides the derived id, for the
 * rare button whose text changes but whose identity should not.
 */
export function trackCtaFromElement(el: HTMLElement): void {
  try {
    const href = el.getAttribute("href");
    const isSubmit =
      el.tagName === "BUTTON" && el.getAttribute("type") === "submit";
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80);

    const { section, index } = sectionOf(el);
    const location = locationOf(el, section, index);
    const destination = destinationOf(href, isSubmit);
    // The template's primary variant is the only one painted in the action
    // colour, which is what "primary" means in the report.
    const isPrimary = el.className.includes("bg-brand");

    trackCtaClick({
      cta_id: el.dataset.ctaId || idFrom(location, text, section, index),
      cta_location: location,
      cta_text: text,
      cta_type: typeOf(destination, isPrimary),
      cta_destination: destination,
    });
  } catch {
    // Reporting is diagnostics; it must never break a click.
  }
}
