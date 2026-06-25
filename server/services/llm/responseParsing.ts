export const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export const isString = (value: unknown): value is string => (
  typeof value === 'string'
);

export const extractChatCompletionContent = (data: unknown): string => {
  if (!isRecord(data) || !Array.isArray(data.choices)) {
    return '';
  }

  const firstChoice = data.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return '';
  }

  const content = firstChoice.message.content;
  return typeof content === 'string' ? content : '';
};
