import { Injectable } from "@nestjs/common";

import { AiIntegrationService } from "@app/modules/ai/ai-integration.service";
import {
  STREAM_TEMPERATURE,
} from "@app/modules/ai/llm/llm.constants";
import { z } from "zod";

type AiSdkModule = typeof import("ai");
type DynamicImport = <TModule>(specifier: string) => Promise<TModule>;

export interface LlmPromptInput {
  system: string;
  prompt: string;
}

// Preserve native dynamic import after CommonJS compilation; AI SDK packages are ESM-only.
const dynamicImport = new Function(
  "specifier",
  "return import(specifier)"
) as DynamicImport;

@Injectable()
export class LlmService {
  private readonly aiSdk: Promise<AiSdkModule>;
  private readonly aiIntegration: AiIntegrationService;

  constructor(aiIntegration: AiIntegrationService) {
    this.aiIntegration = aiIntegration;
    this.aiSdk = dynamicImport<AiSdkModule>("ai");
  }

  async *stream(input: LlmPromptInput): AsyncIterable<string> {
    const [{ streamText }, languageModel] = await Promise.all([
      this.aiSdk,
      this.aiIntegration.getLanguageModel(),
    ]);

    const result = streamText({
      model: languageModel,
      system: input.system,
      prompt: input.prompt,
      temperature: STREAM_TEMPERATURE,
    });

    for await (const textPart of result.textStream) {
      yield textPart;
    }
  }

  async generateText(input: LlmPromptInput): Promise<string> {
    const [{ generateText }, languageModel] = await Promise.all([
      this.aiSdk,
      this.aiIntegration.getLanguageModel(),
    ]);
    const { text } = await generateText({
      model: languageModel,
      system: input.system,
      prompt: input.prompt,
      temperature: STREAM_TEMPERATURE,
    });

    return text;
  }

  async generateObject<TOutput>(
    input: LlmPromptInput,
    schema: z.ZodType<TOutput>
  ): Promise<TOutput> {
    const [{ generateText, Output }, languageModel] = await Promise.all([
      this.aiSdk,
      this.aiIntegration.getLanguageModel(),
    ]);
    const { output } = await generateText({
      model: languageModel,
      output: Output.object({ schema }),
      system: input.system,
      prompt: input.prompt,
      temperature: STREAM_TEMPERATURE,
    });

    return output;
  }
}
