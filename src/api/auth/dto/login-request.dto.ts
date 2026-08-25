import { IsString, MinLength } from "class-validator";

export class LoginRequestDto {
  @IsString()
  @MinLength(1)
  user_name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
