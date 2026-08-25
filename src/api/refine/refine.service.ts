import { Injectable } from "@nestjs/common";

import { AiService } from "@app/modules/ai/ai.service";
import { AiContextBuilderService } from "@app/modules/ai-context-builder/ai-context-builder.service";
import { RefineRequestDto } from "@app/api/refine/dto/refine-request.dto";
import { RefineAction } from "@app/api/refine/enums/refine-action.enum";
import { DEFAULT_TARGET_LANGUAGE } from "@app/api/refine/refine.constants";

@Injectable()
export class RefineService {
  constructor(
    private readonly aiService: AiService,
    private readonly aiContextBuilder: AiContextBuilderService
  ) {}

  async *streamRefinedMessage(request: RefineRequestDto): AsyncIterable<string> {
    const prompt = this.aiContextBuilder.buildRefinePrompt({
      action: request.action,
      message: request.message,
      targetLanguage: request.targetLanguage || DEFAULT_TARGET_LANGUAGE,
    });

    yield* this.aiService.streamPrompt(prompt);
  }

  getSupportedActions(): RefineAction[] {
    return Object.values(RefineAction);
  }
}
