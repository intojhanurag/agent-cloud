/**
 * Lazy model selection - resolved at runtime, not import time.
 * This allows env vars to be loaded (e.g. via dotenv) before the model is chosen.
 */
export function getModelId(): string {
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return 'google/gemini-2.0-flash';
    }
    return 'openai/gpt-4o-mini';
}
