/**
 * CONSTRUMETRIX - MONITORING & OBSERVABILITY v1.0
 * Powered by Sentry.io (Implementation Template)
 */

(function () {
    // SENTRY_DSN: Se prioriza el valor guardado en localStorage (configuración por UI)
    const STORAGE_KEY = 'construmetrix_node_config';
    const config = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const SENTRY_DSN = config.sentryDsn || "";

    if (SENTRY_DSN) {
        // Inicialización del SDK si ya está cargado por el script tag
        if (window.Sentry) {
            Sentry.init({
                dsn: SENTRY_DSN,
                integrations: [
                    Sentry.browserTracingIntegration(),
                ],
                // Performance Monitoring
                tracesSampleRate: 1.0,
                // Session Replay
                replaysSessionSampleRate: 0.1,
                replaysOnErrorSampleRate: 1.0,
            });
            console.log("🛠️ Sentry Observability: Active");
        }
    } else {
        // Silent in production if DSN is missing
        console.log("ℹ️ Sentry Monitoring: DSN missing. Observation disabled.");
    }

    // Custom Error Logger for Local Development
    window.logError = function (error, context = {}) {
        console.error(`[CM-ERROR] ${error.message}`, { error, context });
        if (window.Sentry && SENTRY_DSN) {
            Sentry.captureException(error, { extra: context });
        }
    };
})();
