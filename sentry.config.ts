export const sentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.SENTRY_DSN,
}
