import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

import { AuthController } from "@app/api/auth/auth.controller";
import { AuthService } from "@app/api/auth/auth.service";
import { JwtAuthGuard } from "@app/api/auth/guards/jwt-auth.guard";
import { PrismaModule } from "@app/modules/prisma/prisma.module";

@Module({
  imports: [JwtModule.register({}), PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ],
  exports: [AuthService]
})
export class AuthModule {}
