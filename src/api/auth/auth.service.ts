import { createHash, randomUUID } from "crypto";

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";

import {
  AuthResponseDto,
  AuthUserResponse,
} from "@app/api/auth/dto/auth-response.dto";
import { DEFAULT_ACCESS_TOKEN_TTL_SECONDS } from "@app/api/auth/auth.constants";
import { LoginRequestDto } from "@app/api/auth/dto/login-request.dto";
import { RegisterRequestDto } from "@app/api/auth/dto/register-request.dto";
import { AuthenticatedUser } from "@app/api/auth/interfaces/authenticated-request.interface";
import { EnvKey } from "@app/config/env-key.enum";
import { PrismaService } from "@app/modules/prisma/prisma.service";

interface AccessTokenPayload {
  sub: string;
  user_name?: string;
  sid: string;
}

interface AuthUserRecord {
  id: string;
  userName: string;
  name: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(request: RegisterRequestDto): Promise<AuthResponseDto> {
    const passwordHash = await hash(request.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          userName: this.normalizeUserName(request.user_name),
          passwordHash,
          name: request.name?.trim() || null,
        },
      });

      return this.createSession(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("User name is already registered");
      }

      throw error;
    }
  }

  async login(request: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { userName: this.normalizeUserName(request.user_name) },
    });

    if (!user || !(await compare(request.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid user name or password");
    }

    return this.createSession(user);
  }

  async validateAccessToken(
    token: string,
  ): Promise<AuthenticatedUser & { sessionId: string }> {
    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.getJwtSecret(),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.tokenHash !== this.hashToken(token)
    ) {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    return {
      id: session.user.id,
      user_name: session.user.userName,
      name: session.user.name,
      sessionId: session.id,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async createSession(user: AuthUserRecord): Promise<AuthResponseDto> {
    const ttlSeconds = this.getAccessTokenTtlSeconds();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const sessionId = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        user_name: user.userName,
        sid: sessionId,
      } satisfies AccessTokenPayload,
      {
        secret: this.getJwtSecret(),
        expiresIn: ttlSeconds,
      },
    );

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: this.hashToken(accessToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      expiresAt: expiresAt.toISOString(),
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: AuthUserRecord): AuthUserResponse {
    return {
      id: user.id,
      user_name: user.userName,
      name: user.name,
    };
  }

  private normalizeUserName(userName: string): string {
    return userName.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private getJwtSecret(): string {
    const secret = this.configService.get<string>(EnvKey.JwtSecret);

    if (!secret) {
      throw new Error(`${EnvKey.JwtSecret} is required`);
    }

    return secret;
  }

  private getAccessTokenTtlSeconds(): number {
    const rawTtl = this.configService.get<string>(EnvKey.AccessTokenTtlSeconds);
    const ttl = rawTtl ? Number(rawTtl) : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;

    return Number.isFinite(ttl) && ttl > 0
      ? ttl
      : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
  }
}
