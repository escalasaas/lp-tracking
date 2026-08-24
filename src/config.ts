/**
 * Per-site configuration.
 *
 * Everything that differs between one landing page and the next lives here, so
 * the tracking logic itself is identical everywhere. That is the whole point of
 * extracting this package: a fix applied once reaches every site, instead of
 * being re-applied N times and drifting until the reports stop being comparable.
 */
export type TrackingConfig = {
  /**
   * Where events are POSTed. Same-origin by default so a proxy rule keeps the
   * browser from seeing the API host — no CORS, no preflight on the hot path.
   */
  eventsPath: string;
  /**
   * Which experiments this page is running, as {experiment_id: variant}.
   *
   * Injected rather than imported: assignment is site-specific (each site has
   * its own registry and split), while everything else here is not. Defaults to
   * none, so a site with no A/B tooling works untouched.
   *
   * Note the site itself is NOT configured here — the API derives it from the
   * request Origin, which a page cannot forge to write into another site's data.
   */
  getAssignments: () => Record<string, string>;
  /** Build SHA, for correlating a metric change with the deploy that caused it. */
  releaseSha: string;
  /** Extra properties attached to every event. */
  defaultProperties: Record<string, unknown>;
  /**
   * Chamado depois de cada evento nosso, com o mesmo nome e propriedades.
   *
   * Existe para espelhar os eventos numa ferramenta de terceiro — o PostHog do
   * cliente, o GA de outro — sem que a página passe a chamar as duas coisas em
   * cada botão. Duplicar a chamada por botão é o começo do drift: um dos dois
   * lados deixa de ser atualizado e os relatórios param de bater.
   *
   * Nunca recebe o que identifica a pessoa: só o que já vai para a nossa API.
   * O que ele faz com isso é problema dele; erro aqui é engolido, porque um
   * espelho quebrado não pode derrubar a medição que é nossa.
   */
  onEvent?: (name: string, properties: Record<string, unknown>) => void;
};

const config: TrackingConfig = {
  eventsPath: "/api/events",
  getAssignments: () => ({}),
  releaseSha: "",
  defaultProperties: {},
};

/** Call once, before anything is tracked. */
export function configureTracking(options: Partial<TrackingConfig>): void {
  Object.assign(config, options);
}

export function getTrackingConfig(): Readonly<TrackingConfig> {
  return config;
}
