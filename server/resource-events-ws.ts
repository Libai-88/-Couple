const RESOURCE_EVENT_TYPES = new Set([
  "resource.changed",
  "resource.deleted",
  "resource.renamed",
]);

export function toResourceEventWsMessage(event: { type?: string; sessionPath?: string; [key: string]: unknown }, sessionPath: string | null = null) {
  if (!event || typeof event !== "object") return null;
  if (!RESOURCE_EVENT_TYPES.has(event.type as string)) return null;
  if (event.sessionPath || !sessionPath) return event;
  return { ...event, sessionPath };
}
