import { Injectable, InternalServerErrorException } from "@nestjs/common";
import type { Response } from "express";

import { SseEvent } from "@app/common/sse/sse-event.enum";
import {
  prepareSseResponse,
  writeSseEvent,
} from "@app/common/sse/sse-response.util";

interface StreamTextOptions {
  emptyResponseMessage?: string;
  errorMessage?: string;
  onComplete?: (fullResponse: string) => Promise<void> | void;
}

@Injectable()
export class SseStreamService {
  async streamText(
    response: Response,
    stream: AsyncIterable<string>,
    options: StreamTextOptions = {},
  ): Promise<void> {
    const emptyResponseMessage =
      options.emptyResponseMessage || "AI provider returned an empty response";
    const errorMessage = options.errorMessage || "Unknown streaming error";

    prepareSseResponse(response);

    try {
      const fullResponse = await this.writeDeltaEvents(response, stream);

      if (fullResponse.trim().length === 0) {
        throw new InternalServerErrorException(emptyResponseMessage);
      }

      await options.onComplete?.(fullResponse);
      writeSseEvent(response, SseEvent.Done, { ok: true });
    } catch (error) {
      writeSseEvent(response, SseEvent.Error, {
        message: error instanceof Error ? error.message : errorMessage,
      });
    } finally {
      response.end();
    }
  }

  private async writeDeltaEvents(
    response: Response,
    stream: AsyncIterable<string>,
  ): Promise<string> {
    let fullResponse = "";

    for await (const chunk of stream) {
      fullResponse += chunk;
      writeSseEvent(response, SseEvent.Delta, { text: chunk });
    }

    return fullResponse;
  }
}
