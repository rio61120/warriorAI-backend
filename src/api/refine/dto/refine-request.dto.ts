import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

import {
  MAX_MESSAGE_LENGTH,
  MAX_TARGET_LANGUAGE_LENGTH,
  MIN_MESSAGE_LENGTH,
} from "@app/api/refine/refine.constants";
import { RefineAction } from "@app/api/refine/enums/refine-action.enum";

export class RefineRequestDto {
  @IsEnum(RefineAction)
  action: RefineAction;

  @IsString()
  @MinLength(MIN_MESSAGE_LENGTH)
  @MaxLength(MAX_MESSAGE_LENGTH)
  message: string;

  @ValidateIf(
    (payload: RefineRequestDto) => payload.action === RefineAction.Translate,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(MAX_TARGET_LANGUAGE_LENGTH)
  targetLanguage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceLanguage?: string;
}
