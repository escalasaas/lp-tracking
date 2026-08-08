/** Stable analytics form ids — not the Make form_id env override. */
/** Section is a free string here: each site names its own forms. */
export function analyticsFormId(section: string): string {
  return section === "diagnostico"
    ? "formulario-diagnostico"
    : "formulario-final";
}

/** Map HTML `name` attributes to stable field identifiers (never values). */
const FIELD_ID_BY_NAME: Record<string, string> = {
  name: "nome",
  tel: "telefone",
  email: "email",
  organization: "empresa",
  moment: "momento",
  investment: "investimento",
  decisionTime: "tempo_decisao",
};

/** Visual / tab order on the LP form — used to pick friction, not last focus. */
export const FORM_FIELD_ORDER = [
  "nome",
  "telefone",
  "email",
  "empresa",
  "momento",
  "investimento",
  "tempo_decisao",
] as const;

/**
 * First field (in form order) that was touched but left empty.
 * Falls back to last interacted, then null.
 */
export function resolveFrictionField(
  touched: string[],
  filled: string[],
  lastFieldInteracted: string | null,
): string | null {
  const filledSet = new Set(filled);
  const touchedSet = new Set(touched);

  for (const field of FORM_FIELD_ORDER) {
    if (touchedSet.has(field) && !filledSet.has(field)) {
      return field;
    }
  }

  for (const field of touched) {
    if (!filledSet.has(field)) {
      return field;
    }
  }

  return lastFieldInteracted;
}

/**
 * Resolve a field id from a real form control (`name`) or from a custom
 * control that proxies one (`data-field`, e.g. the FormSelect trigger and
 * its options — the underlying `<select>` is hidden and never interacted with).
 */
export function fieldIdFromElement(el: Element | null): string | null {
  if (!(el instanceof HTMLElement)) {
    return null;
  }
  const name = el.getAttribute("data-field") ?? el.getAttribute("name");
  if (!name || name === "website") {
    return null;
  }
  return FIELD_ID_BY_NAME[name] ?? name;
}

export type FormErrorType =
  | "required"
  | "invalid_format"
  | "invalid_email"
  | "invalid_phone"
  | "min_length"
  | "max_length"
  | "server_error"
  | "network_error"
  | "unknown";

export type ClassifiedFormError = {
  field_name: string;
  error_type: FormErrorType;
};

function classifyControl(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): ClassifiedFormError {
  const field_name = fieldIdFromElement(control) ?? "unknown";
  const validity = control.validity;

  if (control instanceof HTMLInputElement && control.type === "tel") {
    if (validity.valueMissing) {
      return { field_name, error_type: "required" };
    }
    if (validity.customError || validity.patternMismatch || validity.tooShort) {
      return { field_name, error_type: "invalid_phone" };
    }
  }

  if (validity.valueMissing) {
    return { field_name, error_type: "required" };
  }
  if (
    control instanceof HTMLInputElement &&
    control.type === "email" &&
    (validity.typeMismatch || validity.patternMismatch)
  ) {
    return { field_name, error_type: "invalid_email" };
  }
  if (validity.tooShort) {
    return { field_name, error_type: "min_length" };
  }
  if (validity.tooLong) {
    return { field_name, error_type: "max_length" };
  }
  if (validity.typeMismatch || validity.patternMismatch || validity.badInput) {
    return { field_name, error_type: "invalid_format" };
  }
  if (validity.customError) {
    return {
      field_name,
      error_type: field_name === "telefone" ? "invalid_phone" : "invalid_format",
    };
  }

  return { field_name, error_type: "unknown" };
}

/**
 * Classify the first invalid control without reading its value into analytics.
 */
export function classifyFormError(form: HTMLFormElement): ClassifiedFormError {
  const invalid = form.querySelector(":invalid");
  if (
    !(invalid instanceof HTMLInputElement) &&
    !(invalid instanceof HTMLSelectElement) &&
    !(invalid instanceof HTMLTextAreaElement)
  ) {
    return { field_name: "unknown", error_type: "unknown" };
  }
  return classifyControl(invalid);
}

/**
 * Classify every invalid control (for missing_fields / invalid_fields).
 * Never reads control values into the returned payload.
 */
export function classifyAllFormErrors(form: HTMLFormElement): {
  primary: ClassifiedFormError;
  invalid_fields: ClassifiedFormError[];
  missing_fields: string[];
} {
  const nodes = form.querySelectorAll(":invalid");
  const invalid_fields: ClassifiedFormError[] = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    if (
      !(node instanceof HTMLInputElement) &&
      !(node instanceof HTMLSelectElement) &&
      !(node instanceof HTMLTextAreaElement)
    ) {
      continue;
    }
    if (node.getAttribute("name") === "website") {
      continue;
    }
    const classified = classifyControl(node);
    if (seen.has(classified.field_name)) {
      continue;
    }
    seen.add(classified.field_name);
    invalid_fields.push(classified);
  }

  const primary = invalid_fields[0] ?? {
    field_name: "unknown",
    error_type: "unknown" as FormErrorType,
  };
  const missing_fields = invalid_fields
    .filter((row) => row.error_type === "required")
    .map((row) => row.field_name);

  return { primary, invalid_fields, missing_fields };
}

/** Whether a control has non-empty user input — used only as a boolean for analytics. */
export function controlHasValue(el: Element | null): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value.trim() !== "";
  }
  if (el instanceof HTMLSelectElement) {
    return el.value.trim() !== "";
  }
  // Custom controls report their own state — the option button says "true"
  // because the click that reaches us is the one that fills the field.
  if (el instanceof HTMLElement && el.hasAttribute("data-filled")) {
    return el.getAttribute("data-filled") === "true";
  }
  return false;
}

export function formStepProps() {
  return {
    form_step: "single_step",
    form_step_index: 1,
  };
}
