import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import swapiConfig from './swapi/config/swapi.config';
import throttlerConfig from './config/throttler.config';
import path from 'path';
import { existsSync, readdirSync } from 'node:fs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { MoviesModule } from './movies/movies.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './utils/filters/all-exceptions.filter';

function dirHasTranslations(dir: string): boolean {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    return entries.some((entry) => {
      if (entry.isFile()) {
        return entry.name.endsWith('.json');
      }
      if (entry.isDirectory()) {
        try {
          return readdirSync(path.join(dir, entry.name)).some((file) =>
            file.endsWith('.json'),
          );
        } catch {
          return false;
        }
      }
      return false;
    });
  } catch {
    return false;
  }
}

const i18nCandidatePaths = [
  path.join(__dirname, '../src/i18n'),
  path.join(__dirname, 'i18n'),
  path.join(__dirname, '../i18n'),
  path.join(__dirname, '../dist/i18n'),
];

const i18nLoadPath =
  i18nCandidatePaths.find(
    (candidate) => existsSync(candidate) && dirHasTranslations(candidate),
  ) ??
  i18nCandidatePaths.find((candidate) => existsSync(candidate)) ??
  i18nCandidatePaths[2] ??
  '';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        swapiConfig,
        throttlerConfig,
      ],
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        // ttl is in seconds when using the numeric options object
        throttlers: [
          {
            ttl:
              configService.getOrThrow('throttler.ttl', { infer: true }) * 1000,
            limit: configService.getOrThrow('throttler.limit', {
              infer: true,
            }),
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: {
          path: i18nLoadPath,
          // File watching is not available in serverless filesystems (Vercel),
          // so it is only enabled outside production.
          watch:
            configService.getOrThrow('app.nodeEnv', { infer: true }) !==
            'production',
        },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    SessionModule,
    MailModule,
    MailerModule,
    MoviesModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
