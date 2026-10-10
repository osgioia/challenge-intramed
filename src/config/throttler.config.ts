import { registerAs } from '@nestjs/config';

import { IsInt, IsOptional, Min } from 'class-validator';
import validateConfig from '../utils/validate-config';
import { ThrottlerConfig } from './throttler-config.type';

class EnvironmentVariablesValidator {
  @IsOptional()
  @IsInt()
  @Min(1)
  THROTTLER_TTL: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  THROTTLER_LIMIT: number;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw || raw.trim() === '') {
    return fallback;
  }
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

export default registerAs<ThrottlerConfig>('throttler', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    // Window length in seconds.
    ttl: parsePositiveInt(process.env.THROTTLER_TTL, 60),
    // Max requests per window per IP (global). Generous by default so normal
    // API usage is not blocked; tune down in production if needed.
    // Note: the SWAPI /movies/sync endpoint has its own stricter limit
    // (see @Throttle in movies.controller.ts).
    limit: parsePositiveInt(process.env.THROTTLER_LIMIT, 300),
  };
});
