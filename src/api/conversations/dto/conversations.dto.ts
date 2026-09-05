import { MessageRole } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class CreateMessageDto {
  @IsEnum(MessageRole)
  role: MessageRole;

  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  content: string;
}

export class AskConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  message: string;
}

export interface ConversationResponseDto {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MessageResponseDto {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}
