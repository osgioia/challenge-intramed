import helmet from 'helmet';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';

/**
 * Shared NestJS bootstrap (helmet, CORS, global prefix, versioning,
 * validation pipes, serializers). Used both by the long-running server
 * (src/main.ts, Docker) and by the Vercel serverless entry (api/index.ts)
 * so both environments behave exactly the same.
 */
export function setupApp(app: INestApplication): INestApplication {
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigins = configService.getOrThrow('app.corsOrigins', {
    infer: true,
  });
  app.enableCors({
    origin: corsOrigins.includes('*') ? '*' : corsOrigins,
  });

  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  return app;
}

/**
 * Serves the OpenAPI document and Swagger UI at /docs (and /docs-json).
 * Exposed in every environment on purpose, so the deployed API is
 * self-documenting.
 */
export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('Star Wars Movies Management API')
    .setDescription(
      [
        'REST API to manage Star Wars movies: full CRUD, pagination, search and one-click synchronization with the Star Wars API (SWAPI).',
        '',
        '**Authentication:** all endpoints require a JWT access token (except registration/login). Obtain one via `POST /api/v1/auth/email/login` and send it as `Authorization: Bearer <token>`.',
        '',
        '**Roles:** `user` can read movies; only `admin` can create, update, delete movies or run the SWAPI synchronization.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      in: 'header',
      description: 'JWT access token obtained from /api/v1/auth/email/login',
    })
    .addTag('Auth', 'Registration, login and session management')
    .addTag('Users', 'User administration (admin only)')
    .addTag('Movies', 'Star Wars movies CRUD and SWAPI synchronization')
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);
}
