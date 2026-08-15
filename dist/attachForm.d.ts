/**
 * Chame uma vez, com o elemento do formulário.
 *
 * Devolve a função de desligar, para o React limpar no unmount. Chamar duas
 * vezes no mesmo formulário é inofensivo: o segundo registro substitui o
 * primeiro e os ouvintes anteriores são removidos.
 */
export declare function attachFormTracking(form: HTMLFormElement, formId: string): () => void;
/**
 * Registra a tentativa de envio. Antes da validação, de propósito: "tentou
 * enviar" precisa incluir quem apertou o botão e foi barrado.
 */
export declare function trackFormAttempt(form: HTMLFormElement, formId: string): void;
/**
 * Registra a reprovação na validação, **com o campo que travou**.
 *
 * O nome do campo é o ponto: sem ele o relatório de fricção mostra
 * "sem_dados" para todo mundo, que é uma coluna inteira sem informação
 * nenhuma parecendo um resultado.
 */
export declare function trackFormError(form: HTMLFormElement, formId: string): void;
/**
 * Registra o envio bem-sucedido, sob os **dois** nomes.
 *
 * `form_submit` é o que a conta de abandono usa para saber quem enviou;
 * `form_submit_success` é o que a etapa do funil lê. Emitir só o segundo faz
 * todo mundo que enviou continuar contando como abandono — a taxa vai a 100%
 * e ninguém desconfia, porque o funil em si fica certo.
 */
export declare function trackFormSuccess(form: HTMLFormElement, formId: string): void;
/** Registra a falha do envio em si — rede, servidor, webhook fora. */
export declare function trackFormSubmitError(form: HTMLFormElement, formId: string, motivo?: string): void;
