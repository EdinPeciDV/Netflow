import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig, dbConfig, jwtConfig, redisConfig } from './config/env.config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { FlowsModule } from './flows/flows.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, redisConfig, jwtConfig],
    }),
    HealthModule,
    AuthModule,
    DevicesModule,
    FlowsModule,
  ],
})
export class AppModule {}
