import * as Sentry from '@sentry/nestjs';

const sentryDsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || 'development';
const release = process.env.APP_VERSION || '1.0.0';

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: true,
    environment,
    release,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
  });

  console.log(`Sentry initialized for environment: ${environment}`);
} else {
  console.warn('Sentry DSN not provided, error tracking disabled');
}
