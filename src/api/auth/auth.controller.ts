import { Body, Controller, Get, Post, Req } from "@nestjs/common";

import { AuthService } from "@app/api/auth/auth.service";
import { Public } from "@app/api/auth/decorators/public.decorator";
import {
  AuthResponseDto,
  AuthUserResponse,
} from "@app/api/auth/dto/auth-response.dto";
import { LoginRequestDto } from "@app/api/auth/dto/login-request.dto";
import { RegisterRequestDto } from "@app/api/auth/dto/register-request.dto";
import { AuthenticatedRequest } from "@app/api/auth/interfaces/authenticated-request.interface";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() request: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(request);
  }

  @Public()
  @Post("login")
  login(@Body() request: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(request);
  }

  @Get("me")
  me(@Req() request: AuthenticatedRequest): AuthUserResponse {
    return request.user;
  }

  @Post("logout")
  async logout(@Req() request: AuthenticatedRequest): Promise<{ ok: true }> {
    await this.authService.logout(request.sessionId);
    return { ok: true };
  }
}
