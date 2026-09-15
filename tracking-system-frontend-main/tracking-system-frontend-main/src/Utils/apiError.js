const TECHNICAL_ERROR_PATTERNS = [
  /ENOTFOUND/i,
  /ECONNREFUSED/i,
  /ECONNRESET/i,
  /ETIMEDOUT/i,
  /getaddrinfo/i,
  /MongoServerError/i,
  /MongoNetworkError/i,
  /mongodb/i,
  /E11000/i,
  /network error/i,
  /socket hang up/i,
  /failed to fetch/i,
];

export const isTechnicalErrorMessage = (message) => {
  if (!message || typeof message !== 'string') return false;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

export const getFriendlyErrorMessage = (
  error,
  fallback = 'Something went wrong. Please refresh the page and try again.',
) => {
  if (!error?.response) {
    return 'Unable to connect to the server. Please check your connection and refresh the page.';
  }

  const { status, data } = error.response;
  const message = data?.message;

  if (Array.isArray(message)) {
    const first = message.find((item) => typeof item?.msg === 'string')?.msg;
    if (first && !isTechnicalErrorMessage(first)) return first;
    return fallback;
  }

  if (typeof message === 'string' && message.trim() && !isTechnicalErrorMessage(message)) {
    return message;
  }

  if (status >= 500) {
    return fallback;
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return 'The requested information could not be found.';
  }

  return fallback;
};

export const isServerOrNetworkError = (error) => {
  if (!error?.response) return true;

  const message = error.response?.data?.message;
  if (typeof message === 'string' && isTechnicalErrorMessage(message)) return true;

  return error.response.status >= 500;
};
