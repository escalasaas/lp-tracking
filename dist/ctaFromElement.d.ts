/**
 * Ouve o clique no documento inteiro, em vez de exigir uma alteração no
 * componente de botão de cada landing page.
 *
 * A alternativa era editar o `Button` das 32, e as 32 divergem no detalhe: umas
 * já tratam `onClick` para rolagem suave, outras têm o elemento em uma linha,
 * outras em cinco. Editar por regex nesse terreno produz código plausível e
 * errado, que é pior que não instrumentar.
 *
 * O filtro é deliberadamente estreito: âncora com destino e botão de envio.
 * Isso pega CTA e formulário e deixa de fora o que é controle de interface —
 * gatilho de acordeão e alternador de menu são `button` sem `href` e sem
 * `submit`, e encheriam o relatório de cliques que não são intenção de compra.
 */
export declare function initCtaTracking(): void;
/**
 * Registra um clique a partir do elemento. Público para o caso raro de uma
 * página querer marcar algo que o filtro do ouvinte não pega.
 *
 * Nunca lança e nunca bloqueia: um CTA que falha em reportar ainda tem que
 * navegar. `data-cta-id` no elemento sobrescreve o id derivado.
 */
export declare function trackCtaFromElement(el: HTMLElement): void;
