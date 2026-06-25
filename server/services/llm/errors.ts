export class MissingApiKeyError extends Error {
  readonly code = 'MISSING_API_KEY';

  constructor(message: string) {
    super(message);
    this.name = 'MissingApiKeyError';
  }
}

export class ProviderRateLimitError extends Error {
  readonly code = 'QUOTA_EXCEEDED';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProviderRateLimitError';
  }
}

export const getErrorMessage = (err: unknown): string => (
  err instanceof Error ? err.message : String(err)
);

export const isProviderRateLimitError = (err: unknown): boolean => {
  if (err instanceof ProviderRateLimitError) return true;
  const message = getErrorMessage(err);
  return message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('Quota exceeded') ||
    message.includes('quota exceeded') ||
    message.includes('429');
};

export const isProviderAuthError = (err: unknown): boolean => {
  const message = getErrorMessage(err);
  return message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('API_KEY_UNAUTHORIZED') ||
    message.includes('Endpoint returned status 401') ||
    message.includes('Endpoint returned status 403');
};

export const isRecoverableRoutingError = (err: unknown): boolean => (
  !isProviderRateLimitError(err) && !isProviderAuthError(err) && !(err instanceof MissingApiKeyError)
);
