import * as Sentry from "@sentry/nuxt";

Sentry.init({
  // If set up, you can use your runtime config here
  // dsn: useRuntimeConfig().public.sentry.dsn,
  dsn: "https://c41661e94af21306782c4cfca51368b4@o178577.ingest.us.sentry.io/4509538757967872",

  // Tracing tree-shaken out via __SENTRY_TRACING__=false in nuxt.config.ts.
  debug: false,
});
