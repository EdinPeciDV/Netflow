import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { appConfig, dbConfig, jwtConfig, redisConfig } from './config/env.config';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { FlowsModule } from './flows/flows.module';
import { AlertRulesModule } from './alerts/alert-rules.module';
import { AlertEventsModule } from './alerts/alert-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, redisConfig, jwtConfig],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        }),
        ttl: 30_000,
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        database: config.get<string>('db.name'),
        username: config.get<string>('db.user'),
        password: config.get<string>('db.password'),
        autoLoadEntities: true,
        synchronize: false,
        logging: config.get<string>('app.nodeEnv') === 'development',
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    DevicesModule,
    FlowsModule,
    AlertRulesModule,
    AlertEventsModule,
  ],
})
export class AppModule {}
