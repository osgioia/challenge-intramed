import { AppConfig } from './app-config.type';
import { AuthConfig } from '../auth/config/auth-config.type';
import { DatabaseConfig } from '../database/config/database-config.type';
import { MailConfig } from '../mail/config/mail-config.type';
import { SwapiConfig } from '../swapi/config/swapi-config.type';
import { ThrottlerConfig } from './throttler-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
  mail: MailConfig;
  swapi: SwapiConfig;
  throttler: ThrottlerConfig;
};
