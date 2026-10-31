import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig, dbConfig, jwtConfig, redisConfig } from './config/env.config';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DevicesModule } from './devices/devices.module';
import { FlowsModule } from './flows/flows.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, redisConfig, jwtConfig],
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
  ],
})
export class AppModule {}
