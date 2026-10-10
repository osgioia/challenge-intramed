import { registerAs } from '@nestjs/config';

import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { SwapiConfig } from './swapi-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  SWAPI_BASE_URL: string;

  @IsInt()
  @Min(1)
  @Max(600000)
  @IsOptional()
  SWAPI_REQUEST_TIMEOUT: number;
}

export default registerAs<SwapiConfig>('swapi', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    baseUrl: process.env.SWAPI_BASE_URL || 'https://www.swapi.tech/api',
    requestTimeout: process.env.SWAPI_REQUEST_TIMEOUT
      ? parseInt(process.env.SWAPI_REQUEST_TIMEOUT, 10)
      : 10000,
  };
});
