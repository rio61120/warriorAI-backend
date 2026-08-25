import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import { AiChatRequest } from "@app/modules/ai/ai.types";

export class AiChatRequestDto implements AiChatRequest {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  system?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  prompt!: string;
}
