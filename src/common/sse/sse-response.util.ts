import type { Response } from "express";

import { SseEvent } from "@app/common/sse/sse-event.enum";

export function prepareSseResponse(response: Response): void {
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders?.();
}

export function writeSseEvent(
  response: Response,
  event: SseEvent,
  data: unknown,
): void {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}
