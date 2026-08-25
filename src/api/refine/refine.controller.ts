import { Body, Controller, Post, Res } from "@nestjs/common";
import type { Response } from "express";

import { SseStreamService } from "@app/common/sse/sse-stream.service";
import { RefineRequestDto } from "@app/api/refine/dto/refine-request.dto";
import { RefineService } from "@app/api/refine/refine.service";

@Controller("refine")
export class RefineController {
  constructor(
    private readonly refineService: RefineService,
    private readonly sseStreamService: SseStreamService,
  ) {}

  @Post()
  refine(
    @Body() request: RefineRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    return this.sseStreamService.streamText(
      response,
      this.refineService.streamRefinedMessage(request),
      { errorMessage: "Unknown refine error" },
    );
  }
}
