import {
  classifyAllFormErrors,
  fieldIdFromElement,
  resolveFrictionField,
} from "./formTracking.js";
import type { ClassifiedFormError } from "./formTracking.js";
import { trackPageEvent } from "./pageEvents.js";

/**
 * Liga o rastreio de um formulário inteiro a partir do elemento.
 *
 * Existe porque a alternativa é ~80 linhas de estado — campos tocados, campos
 * preenchidos, último campo, se já enviou, se já registrou abandono — repetidas
 * em cada landing page. Repetir isso 30 vezes garante que metade fique
 * levemente diferente, e "campo de fricção" passa a significar coisas
 * diferentes em cada relatório, que é o mesmo que não medir.
 */

type Estado = {
  formId: string;
  iniciou: boolean;
  enviou: boolean;
  abandonou: boolean;
  tocados: Set<string>;
  preenchidos: Set<string>;
  ultimo: string | null;
};

const registro = new WeakMap<HTMLFormElement, Estado>();

function estadoDe(form: HTMLFormElement): Estado | undefined {
  return registro.get(form);
}

/**
 * Chame uma vez, com o elemento do formulário.
 *
 * Devolve a função de desligar, para o React limpar no unmount. Chamar duas
 * vezes no mesmo formulário é inofensivo: o segundo registro substitui o
 * primeiro e os ouvintes anteriores são removidos.
 */
export function attachFormTracking(
  form: HTMLFormElement,
  formId: string,
): () => void {
  const estado: Estado = {
    formId,
    iniciou: false,
    enviou: false,
    abandonou: false,
    tocados: new Set(),
    preenchidos: new Set(),
    ultimo: null,
  };
  registro.set(form, estado);

  function aoFocar(event: Event) {
    const campo = fieldIdFromElement(event.target as Element | null);
    if (!campo) return;

    estado.ultimo = campo;
    estado.tocados.add(campo);

    if (!estado.iniciou) {
      estado.iniciou = true;
      // Separa "não interessou" de "começou e desistiu" — sem isto, quem
      // abandona no meio fica indistinguível de quem nem chegou perto.
      trackPageEvent("form_start", { form_id: formId });
    }
  }

  function aoSair(event: Event) {
    const alvo = event.target as HTMLInputElement | null;
    const campo = fieldIdFromElement(alvo);
    if (!campo || !alvo) return;
    if (alvo.value && alvo.value.trim() !== "") estado.preenchidos.add(campo);
    else estado.preenchidos.delete(campo);
  }

  function talvezAbandonou() {
    if (!estado.iniciou || estado.enviou || estado.abandonou) return;
    estado.abandonou = true;

    const tocados = [...estado.tocados];
    const preenchidos = [...estado.preenchidos];

    trackPageEvent("form_abandon", {
      form_id: formId,
      last_field_interacted: estado.ultimo ?? undefined,
      friction_field:
        resolveFrictionField(tocados, preenchidos, estado.ultimo) ?? undefined,
      fields_touched: tocados,
      fields_filled: preenchidos,
      touched_count: tocados.length,
      filled_count: preenchidos.length,
    });
  }

  function aoEsconder() {
    // `visibilitychange` para hidden é o único sinal que dispara de forma
    // confiável no mobile; `pagehide` cobre o resto. Os dois chamam a mesma
    // função, que só age uma vez.
    if (document.visibilityState === "hidden") talvezAbandonou();
  }

  form.addEventListener("focusin", aoFocar);
  form.addEventListener("focusout", aoSair);
  document.addEventListener("visibilitychange", aoEsconder);
  window.addEventListener("pagehide", talvezAbandonou);

  return () => {
    form.removeEventListener("focusin", aoFocar);
    form.removeEventListener("focusout", aoSair);
    document.removeEventListener("visibilitychange", aoEsconder);
    window.removeEventListener("pagehide", talvezAbandonou);
    registro.delete(form);
  };
}

/**
 * Registra a tentativa de envio. Antes da validação, de propósito: "tentou
 * enviar" precisa incluir quem apertou o botão e foi barrado.
 */
export function trackFormAttempt(form: HTMLFormElement, formId: string): void {
  trackPageEvent("form_submit_attempt", { form_id: formId });
  void form;
}

/**
 * Registra a reprovação na validação, **com o campo que travou**.
 *
 * O nome do campo é o ponto: sem ele o relatório de fricção mostra
 * "sem_dados" para todo mundo, que é uma coluna inteira sem informação
 * nenhuma parecendo um resultado.
 *
 * `campos` é para o formulário que valida em estado do React e marca
 * `noValidate`: ali o DOM não tem `:invalid` para ler, e sem a lista explícita
 * o evento sairia dizendo "unknown" — que é o mesmo buraco com outro nome.
 * Quem valida por conta própria sabe o motivo, então passa o par.
 */
export function trackFormError(
  form: HTMLFormElement,
  formId: string,
  campos?: ClassifiedFormError[],
): void {
  const primeiro = campos?.[0];
  if (campos && primeiro) {
    trackPageEvent("form_error", {
      form_id: formId,
      field_name: primeiro.field_name,
      error_type: primeiro.error_type,
      invalid_fields: campos,
      missing_fields: campos
        .filter((campo) => campo.error_type === "required")
        .map((campo) => campo.field_name),
    });
    return;
  }

  const { primary, invalid_fields, missing_fields } =
    classifyAllFormErrors(form);
  trackPageEvent("form_error", {
    form_id: formId,
    field_name: primary.field_name,
    error_type: primary.error_type,
    invalid_fields,
    missing_fields,
  });
}

/**
 * Registra o envio bem-sucedido, sob os **dois** nomes.
 *
 * `form_submit` é o que a conta de abandono usa para saber quem enviou;
 * `form_submit_success` é o que a etapa do funil lê. Emitir só o segundo faz
 * todo mundo que enviou continuar contando como abandono — a taxa vai a 100%
 * e ninguém desconfia, porque o funil em si fica certo.
 */
export function trackFormSuccess(form: HTMLFormElement, formId: string): void {
  const estado = estadoDe(form);
  if (estado) estado.enviou = true;

  const props = { form_id: formId };
  trackPageEvent("form_submit", props);
  trackPageEvent("form_submit_success", props);
}

/** Registra a falha do envio em si — rede, servidor, webhook fora. */
export function trackFormSubmitError(
  form: HTMLFormElement,
  formId: string,
  motivo?: string,
): void {
  const estado = estadoDe(form);
  trackPageEvent("form_submit_error", {
    form_id: formId,
    last_field_interacted: estado?.ultimo ?? undefined,
    reason: motivo,
  });
}
