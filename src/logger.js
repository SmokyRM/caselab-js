import pino from 'pino';
import { LOG_LEVEL } from './config.js';

export const logger = pino({ level: LOG_LEVEL });

export function getSafeErrorDetails(error) {
  const cause = error?.cause ?? error?.original ?? error?.parent;
  const nestedCause =
    cause?.cause ?? cause?.original ?? cause?.parent ?? cause?.errors?.[0];

  return {
    errorName: error?.name ?? 'Error',
    errorCode: error?.code ?? null,
    errorMessage: error?.message ?? 'Unknown error',
    causeName: cause?.name ?? nestedCause?.name ?? null,
    causeMessage: cause?.message || nestedCause?.message || null,
  };
}
