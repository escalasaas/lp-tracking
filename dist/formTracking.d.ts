/** Stable analytics form ids — not the Make form_id env override. */
/** Section is a free string here: each site names its own forms. */
export declare function analyticsFormId(section: string): string;
/** Visual / tab order on the LP form — used to pick friction, not last focus. */
export declare const FORM_FIELD_ORDER: readonly ["nome", "telefone", "email", "empresa", "momento", "investimento", "tempo_decisao"];
/**
 * First field (in form order) that was touched but left empty.
 * Falls back to last interacted, then null.
 */
export declare function resolveFrictionField(touched: string[], filled: string[], lastFieldInteracted: string | null): string | null;
/**
 * Resolve a field id from a real form control (`name`) or from a custom
 * control that proxies one (`data-field`, e.g. the FormSelect trigger and
 * its options — the underlying `<select>` is hidden and never interacted with).
 */
export declare function fieldIdFromElement(el: Element | null): string | null;
export type FormErrorType = "required" | "invalid_format" | "invalid_email" | "invalid_phone" | "min_length" | "max_length" | "server_error" | "network_error" | "unknown";
export type ClassifiedFormError = {
    field_name: string;
    error_type: FormErrorType;
};
/**
 * Classify the first invalid control without reading its value into analytics.
 */
export declare function classifyFormError(form: HTMLFormElement): ClassifiedFormError;
/**
 * Classify every invalid control (for missing_fields / invalid_fields).
 * Never reads control values into the returned payload.
 */
export declare function classifyAllFormErrors(form: HTMLFormElement): {
    primary: ClassifiedFormError;
    invalid_fields: ClassifiedFormError[];
    missing_fields: string[];
};
/** Whether a control has non-empty user input — used only as a boolean for analytics. */
export declare function controlHasValue(el: Element | null): boolean;
export declare function formStepProps(): {
    form_step: string;
    form_step_index: number;
};
