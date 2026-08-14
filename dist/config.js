const config = {
    eventsPath: "/api/events",
    getAssignments: () => ({}),
    releaseSha: "",
    defaultProperties: {},
};
/** Call once, before anything is tracked. */
export function configureTracking(options) {
    Object.assign(config, options);
}
export function getTrackingConfig() {
    return config;
}
