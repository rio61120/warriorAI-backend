import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { LanguageModel, ModelMessage } from "ai";

import { EnvKey } from "@app/config/env-key.enum";
import {
  DEFAULT_AI_MODEL,
  DEFAULT_AI_PROVIDER,
  STREAM_TEMPERATURE,
} from "@app/modules/ai/llm/llm.constants";

type AiSdkModule = typeof import("ai");
type OpenAiSdkModule = typeof import("@ai-sdk/openai");
type DynamicImport = <TModule>(specifier: string) => Promise<TModule>;

// Preserve native dynamic import after CommonJS compilation; AI SDK packages are ESM-only.
const dynamicImport = new Function(
  "specifier",
  "return import(specifier)",
) as DynamicImport;

@Injectable()
export class LlmService {
  private readonly aiSdk: Promise<AiSdkModule>;
  private readonly languageModel: Promise<LanguageModel>;
  private readonly model: string;
  private readonly provider: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.getConfiguredProvider();
    this.model =
      this.configService.get<string>(EnvKey.AiModel) || DEFAULT_AI_MODEL;
    this.aiSdk = dynamicImport<AiSdkModule>("ai");
    this.languageModel = this.createLanguageModel();
  }

  async *stream(messages: ModelMessage[]): AsyncIterable<string> {
    const [{ streamText }, languageModel] = await Promise.all([
      this.aiSdk,
      this.languageModel,
    ]);

    const result = streamText({
      allowSystemInMessages: true,
      messages,
      model: languageModel,
      temperature: STREAM_TEMPERATURE,
    });

    for await (const textPart of result.textStream) {
      yield textPart;
    }
  }

  async generateText(messages: ModelMessage[]): Promise<string> {
    const [{ generateText }, languageModel] = await Promise.all([
      this.aiSdk,
      this.languageModel,
    ]);
    const { text } = await generateText({
      allowSystemInMessages: true,
      messages,
      model: languageModel,
      temperature: STREAM_TEMPERATURE,
    });

    return text;
  }

  private async createLanguageModel(): Promise<LanguageModel> {
    const apiKey = this.configService.get<string>(EnvKey.AiApiKey);
    const baseURL = this.configService.get<string>(EnvKey.AiBaseUrl);

    if (!baseURL) {
      return this.getGatewayModel();
    }

    if (!apiKey) {
      throw new InternalServerErrorException("AI_API_KEY is not configured");
    }

    const { createOpenAI } =
      await dynamicImport<OpenAiSdkModule>("@ai-sdk/openai");
    const provider = createOpenAI({
      apiKey,
      baseURL,
      name: this.provider,
    });

    return provider.chat(this.model);
  }

  private getGatewayModel(): string {
    if (this.provider === DEFAULT_AI_PROVIDER || this.model.includes("/")) {
      return this.model;
    }

    return `${this.provider}/${this.model}`;
  }

  private getConfiguredProvider(): string {
    return (
      this.configService.get<string>(EnvKey.AiProvider)?.trim() ||
      DEFAULT_AI_PROVIDER
    );
  }
}
