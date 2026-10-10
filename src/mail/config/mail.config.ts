import { registerAs } from '@nestjs/config';

import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MAIL_PORT: number;

  @IsString()
  @IsOptional()
  MAIL_HOST: string;

  @IsString()
  @IsOptional()
  MAIL_USER: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD: string;

  @IsEmail()
  @IsOptional()
  MAIL_DEFAULT_EMAIL: string;

  @IsString()
  @IsOptional()
  MAIL_DEFAULT_NAME: string;

  @IsBoolean()
  @IsOptional()
  MAIL_IGNORE_TLS: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_SECURE: boolean;

  @IsBoolean()
  @IsOptional()
  MAIL_REQUIRE_TLS: boolean;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    port: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 587,
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    user: process.env.MAIL_USER || 'user',
    password: process.env.MAIL_PASSWORD || 'password',
    defaultEmail: process.env.MAIL_DEFAULT_EMAIL || 'default@example.com',
    defaultName: process.env.MAIL_DEFAULT_NAME || 'Mail Service',
    ignoreTLS: process.env.MAIL_IGNORE_TLS !== 'false',
    secure: process.env.MAIL_SECURE === 'true',
    requireTLS: process.env.MAIL_REQUIRE_TLS === 'true',
  };
});
