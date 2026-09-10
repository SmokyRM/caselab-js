const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
const requestTimeoutFromEnv = Number(process.env.REQUEST_TIMEOUT_MS);

export const REQUEST_TIMEOUT_MS =
  Number.isFinite(requestTimeoutFromEnv) && requestTimeoutFromEnv > 0
    ? requestTimeoutFromEnv
    : DEFAULT_REQUEST_TIMEOUT_MS;
