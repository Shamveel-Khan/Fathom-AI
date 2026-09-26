import OpenAI from 'openai';

export interface CreateClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

export function createOpenAIClient(options: CreateClientOptions = {}): OpenAI {
  const key = options.apiKey || process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error('NO_API_KEY');
  }

  return new OpenAI({
    apiKey: key,
    baseURL: options.baseUrl || process.env.OPENAI_BASE_URL || undefined,
  });
}
