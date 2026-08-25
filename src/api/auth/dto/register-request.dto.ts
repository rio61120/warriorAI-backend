import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  user_name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}
