import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { AuthService } from "@app/api/auth/auth.service";
import { IS_PUBLIC_ROUTE_KEY } from "@app/api/auth/decorators/public.decorator";
import { AuthenticatedRequest } from "@app/api/auth/interfaces/authenticated-request.interface";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublicRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    const user = await this.authService.validateAccessToken(token);

    request.user = {
      id: user.id,
      user_name: user.user_name,
      name: user.name,
    };
    request.authToken = token;
    request.sessionId = user.sessionId;

    return true;
  }

  private extractBearerToken(request: Request): string {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException("Missing Authorization header");
    }

    const [scheme, token] = authorization.trim().split(/\s+/);

    if (scheme.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException(
        "Authorization header must be Bearer token",
      );
    }

    return token;
  }
}
