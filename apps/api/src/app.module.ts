import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthGuard } from './common/auth';
import { ErrorFilter } from './common/errors';
import { requestContext } from './common/logging';
import { PrismaService } from './common/prisma.service';
import { RateLimiter } from './common/rate-limit';
import { AdminAuthService } from './modules/admin/admin.auth';
import { AdminController } from './modules/admin/admin.controller';
import { AiProvider, AnthropicProvider } from './modules/ai/ai.provider';
import { CardController } from './modules/ai/card.controller';
import { CardService } from './modules/ai/card.service';
import { AlphaController } from './modules/alpha/alpha.controller';
import { DemoService } from './modules/alpha/demo.service';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { EmailService } from './modules/auth/email.service';
import { DailySetService } from './modules/discovery/daily-set.service';
import { DiscoveryController } from './modules/discovery/discovery.controller';
import { ProfileViewService } from './modules/discovery/profile-view.service';
import { SubjectsService } from './modules/discovery/subjects.service';
import { EngineController } from './modules/engine/engine.controller';
import { EngineService } from './modules/engine/engine.service';
import { FeedbackController } from './modules/feedback/feedback.controller';
import { HealthController } from './modules/health/health.controller';
import { InvitesController } from './modules/invites/invites.controller';
import { InvitesService } from './modules/invites/invites.service';
import { RetentionService } from './modules/jobs/retention.service';
import { ChatService } from './modules/matches/chat.service';
import { LikesService } from './modules/matches/likes.service';
import { MatchesController } from './modules/matches/matches.controller';
import { MeController } from './modules/me/me.controller';
import { MeService } from './modules/me/me.service';
import { NearbyController } from './modules/nearby/nearby.controller';
import { NearbyService } from './modules/nearby/nearby.service';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { NotificationsService } from './modules/notifications/notifications.service';
import { PushService } from './modules/notifications/push.service';
import { ProfileController } from './modules/profile/profile.controller';
import { ProfileService } from './modules/profile/profile.service';
import { RealtimeGateway } from './modules/realtime/realtime.gateway';
import { ReferenceController } from './modules/reference/reference.controller';
import { ReportsController } from './modules/reports/reports.controller';
import { ReportsService } from './modules/reports/reports.service';
import { SafetyController } from './modules/safety/safety.controller';
import { SoulCryptoService } from './modules/soul/soul-crypto.service';
import { SoulController } from './modules/soul/soul.controller';
import { SoulService } from './modules/soul/soul.service';
import { SafetyService } from './modules/safety/safety.service';
import { MediaController } from './modules/storage/media.controller';
import { StorageService } from './modules/storage/storage.service';

@Module({
  imports: [JwtModule.register({}), ScheduleModule.forRoot()],
  controllers: [
    HealthController, AuthController, InvitesController, MeController, EngineController, CardController,
    ProfileController, ReferenceController, MediaController, DiscoveryController, MatchesController,
    NotificationsController, ReportsController, SafetyController, FeedbackController, NearbyController,
    AlphaController, AdminController, SoulController,
  ],
  providers: [
    PrismaService, RateLimiter, EmailService, AuthService, InvitesService, MeService, EngineService, CardService,
    { provide: StorageService, useFactory: (p: PrismaService) => new StorageService(p), inject: [PrismaService] }, ProfileService, SubjectsService, ProfileViewService, DailySetService, LikesService, ChatService,
    RealtimeGateway, PushService, NotificationsService, ReportsService, SafetyService, NearbyService, DemoService,
    RetentionService, AdminAuthService, SoulCryptoService, SoulService,
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
