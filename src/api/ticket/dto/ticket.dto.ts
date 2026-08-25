import { IsString, MinLength } from "class-validator";

export class ClassifyTicketRequestDto {
  @IsString()
  @MinLength(10)
  message: string;
}
