import { AppError } from './errors.ts';
import { errorBus } from './error-bus.ts';

export function safeParseJSON<T = unknown>(text: string, fallback: T | null = null): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    errorBus.report(new AppError('CONFIG_PARSE', { cause: err, context: { textPreview: String(text).slice(0, 100) } }));
    return fallback;
  }
}

export async function safeParseResponse<T = unknown>(res: { ok: boolean; status: number; url: string; text: () => Promise<string>; json: () => Promise<T> }, fallback: T | null = null): Promise<T | null> {
  try {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      errorBus.report(new AppError('FETCH_SERVER_ERROR', {
        message: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        context: { status: res.status, url: res.url },
      }));
      return fallback;
    }
    return await res.json();
  } catch (err) {
    errorBus.report(new AppError('CONFIG_PARSE', { cause: err, context: { url: res?.url } }));
    return fallback;
  }
}
