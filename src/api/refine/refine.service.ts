import { Injectable } from "@nestjs/common";

import { AiService } from "@app/modules/ai/ai.service";
import { buildRefinePrompt } from "@app/modules/prompts/templates/refine.prompt";
import { RefineRequestDto } from "@app/api/refine/dto/refine-request.dto";
import { RefineAction } from "@app/api/refine/enums/refine-action.enum";
import { DEFAULT_TARGET_LANGUAGE } from "@app/api/refine/refine.constants";

@Injectable()
export class RefineService {
  constructor(private readonly aiService: AiService) {}

  async *streamRefinedMessage(request: RefineRequestDto): AsyncIterable<string> {
    const prompt = buildRefinePrompt({
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
