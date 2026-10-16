import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthGuard } from './common/auth';
import { ErrorFilter } from './common/errors';
import { requestContext } from './common/logging';
import { PrismaService } from './common/prisma.service';
import { RateLimiter } from './common/rate-limit';
import { AiProvider, AnthropicProvider } from './modules/ai/ai.provider';
import { CardController } from './modules/ai/card.controller';
import { CardService } from './modules/ai/card.service';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { EmailService } from './modules/auth/email.service';
import { EngineController } from './modules/engine/engine.controller';
import { EngineService } from './modules/engine/engine.service';
import { HealthController } from './modules/health/health.controller';
import { InvitesController } from './modules/invites/invites.controller';
import { InvitesService } from './modules/invites/invites.service';
import { MeController } from './modules/me/me.controller';
import { MeService } from './modules/me/me.service';

@Module({
  imports: [JwtModule.register({}), ScheduleModule.forRoot()],
  controllers: [HealthController, AuthController, InvitesController, MeController, EngineController, CardController],
  providers: [
    PrismaService,
    RateLimiter,
    EmailService,
    AuthService,
    InvitesService,
    MeService,
    EngineService,
    CardService,
    { provide: AiProvider, useClass: AnthropicProvider },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: ErrorFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestContext).forRoutes('*');
  }
}
