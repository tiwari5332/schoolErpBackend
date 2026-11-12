import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DiscoveryModule } from '@nestjs/core';

// Infra
import { InfraModule } from './infra/infra.module';
import { PrismaService } from './infra/db/prisma.service';
import { RedisService } from './infra/cache/redis.service';
import { QueueService } from './infra/queue/queue.service';
import { StorageService } from './infra/storage/storage.service';

// Common
import { Clock } from './common/clock';
import { IdGenerator } from './common/id.generator';
import { IdempotencyService } from './common/idempotency.service';
import { EnvelopeInterceptor } from './common/envelope.interceptor';
import { GlobalExceptionFilter } from './common/exception.filter';

// Guards
import { AuthGuard } from './common/guards/auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { SessionLockGuard } from './common/guards/session-lock.guard';

// Contract
import { ContractCoverageChecker } from './contract/coverage-check';

// Modules
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PlatformModule } from './modules/platform/platform.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { AcademicModule } from './modules/academic/academic.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { StudentsModule } from './modules/students/students.module';
import { StaffModule } from './modules/staff/staff.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { ExamsModule } from './modules/exams/exams.module';
import { FeesModule } from './modules/fees/fees.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BulkModule } from './modules/bulk/bulk.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PortalModule } from './modules/portal/portal.module';

@Module({
  imports: [
    InfraModule,
    DiscoveryModule,
    HealthModule,
    AuthModule,
    OnboardingModule,
    SubscriptionModule,
    PlatformModule,
    RolesModule,
    UsersModule,
    AcademicModule,
    CalendarModule,
    StudentsModule,
    StaffModule,
    AttendanceModule,
    TimetableModule,
    ExamsModule,
    FeesModule,
    CommunicationModule,
    DashboardModule,
    ReportsModule,
    BulkModule,
    SettingsModule,
    PortalModule,
  ],
  providers: [
    // Contract Coverage
    ContractCoverageChecker,

    // Global Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: EnvelopeInterceptor,
    },

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Global Guards in order: Auth -> Permissions -> Subscription -> SessionLock
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SessionLockGuard,
    },
  ],
})
export class AppModule {}

