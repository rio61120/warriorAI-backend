import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EmbeddingModel, LanguageModel } from "ai";

import { EnvKey } from "@app/config/env-key.enum";
import {
  DEFAULT_AI_EMBEDDING_MODEL,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_PROVIDER,
} from "@app/modules/ai/llm/llm.constants";

type OpenAiSdkModule = typeof import("@ai-sdk/openai");
type DynamicImport = <TModule>(specifier: string) => Promise<TModule>;

const dynamicImport = new Function(
  "specifier",
  "return import(specifier)"
) as DynamicImport;

@Injectable()
export class AiIntegrationService {
  private readonly languageModel: Promise<LanguageModel>;
  private readonly embeddingModel: Promise<EmbeddingModel>;
  private readonly model: string;
  private readonly embeddingModelName: string;
  private readonly provider: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.getConfiguredProvider();
    this.model =
      this.configService.get<string>(EnvKey.AiModel) || DEFAULT_AI_MODEL;
    this.embeddingModelName =
      this.configService.get<string>(EnvKey.AiEmbeddingModel) ||
      DEFAULT_AI_EMBEDDING_MODEL;

    this.languageModel = this.createLanguageModel();
    this.embeddingModel = this.createEmbeddingModel();
  }

  getLanguageModel(): Promise<LanguageModel> {
    return this.languageModel;
  }

  getEmbeddingModel(): Promise<EmbeddingModel> {
    return this.embeddingModel;
  }

  private async createLanguageModel(): Promise<LanguageModel> {
    const provider = await this.createOpenAiCompatibleProvider();

    if (!provider) {
      return this.getGatewayModel(this.model);
    }

    return provider.chat(this.model);
  }

  private async createEmbeddingModel(): Promise<EmbeddingModel> {
    const provider = await this.createOpenAiCompatibleProvider();

    if (!provider) {
      return this.getGatewayModel(this.embeddingModelName);
    }

    return provider.embedding(this.embeddingModelName);
  }

  private async createOpenAiCompatibleProvider() {
    const baseURL = this.configService.get<string>(EnvKey.AiBaseUrl);

    if (!baseURL) {
      return null;
    }

    const apiKey = this.configService.get<string>(EnvKey.AiApiKey);

    if (!apiKey) {
      throw new InternalServerErrorException("AI_API_KEY is not configured");
    }

    const { createOpenAI } = await dynamicImport<OpenAiSdkModule>(
      "@ai-sdk/openai"
    );

    return createOpenAI({
      apiKey,
      baseURL,
      name: this.provider,
    });
  }

  private getGatewayModel(model: string): string {
    if (this.provider === DEFAULT_AI_PROVIDER || model.includes("/")) {
      return model;
    }

    return `${this.provider}/${model}`;
  }

  private getConfiguredProvider(): string {
    return (
      this.configService.get<string>(EnvKey.AiProvider)?.trim() ||
      DEFAULT_AI_PROVIDER
    );
  }
}
