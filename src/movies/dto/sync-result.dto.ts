import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export interface SyncStats {
  created: number;
  updated: number;
  failed: number;
  total: number;
}

export interface SyncError {
  title?: string;
  episodeId?: number;
  error: string;
}

export class SyncResultDto {
  @ApiProperty({
    example: true,
    description: 'Whether the synchronization operation was successful',
  })
  @Expose()
  success: boolean;

  @ApiProperty({
    example: 'Synchronization completed successfully',
    description: 'Human-readable message describing the result',
  })
  @Expose()
  message: string;

  @ApiProperty({
    example: {
      created: 3,
      updated: 4,
      failed: 0,
      total: 7,
    },
    description: 'Statistics about the synchronization operation',
  })
  @Expose()
  stats: SyncStats;

  @ApiProperty({
    example: '2023-01-01T12:00:00.000Z',
    description: 'Timestamp when the synchronization started',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  startedAt: string;

  @ApiProperty({
    example: '2023-01-01T12:05:00.000Z',
    description: 'Timestamp when the synchronization completed',
    type: 'string',
    format: 'date-time',
  })
  @Expose()
  completedAt: string;

  @ApiProperty({
    example: 300000,
    description: 'Duration of the synchronization operation in milliseconds',
  })
  @Expose()
  durationMs: number;

  @ApiPropertyOptional({
    example: [
      {
        title: 'The Empire Strikes Back',
        episodeId: 5,
        error: 'Validation failed: Invalid release date format',
      },
    ],
    description: 'Array of errors that occurred during synchronization',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Movie title if available' },
        episodeId: { type: 'number', description: 'Episode ID if available' },
        error: { type: 'string', description: 'Error message' },
      },
    },
  })
  @Expose()
  errors?: SyncError[];

  constructor(
    data: Partial<
      SyncResultDto & { startedAt: Date | string; completedAt: Date | string }
    >,
  ) {
    if (data.success !== undefined) this.success = data.success;
    if (data.message !== undefined) this.message = data.message;
    if (data.stats !== undefined) this.stats = { ...data.stats };
    if (data.startedAt !== undefined) {
      this.startedAt =
        typeof data.startedAt === 'string'
          ? data.startedAt
          : (data.startedAt as Date).toISOString();
    }
    if (data.completedAt !== undefined) {
      this.completedAt =
        typeof data.completedAt === 'string'
          ? data.completedAt
          : (data.completedAt as Date).toISOString();
    }
    if (data.durationMs !== undefined) this.durationMs = data.durationMs;
    if (data.errors !== undefined) this.errors = [...data.errors];
  }

  static success(
    stats: SyncStats,
    startedAt: Date,
    completedAt: Date,
    errors?: SyncError[],
  ): SyncResultDto {
    const hasErrors = errors && errors.length > 0;
    const successMessage = hasErrors
      ? `Synchronization completed with ${errors.length} error(s). Created: ${stats.created}, Updated: ${stats.updated}, Failed: ${stats.failed}`
      : `Synchronization completed successfully. Created: ${stats.created}, Updated: ${stats.updated}`;

    return new SyncResultDto({
      success: !hasErrors,
      message: successMessage,
      stats,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      errors: hasErrors ? errors : undefined,
    });
  }

  static failure(
    error: string,
    startedAt: Date,
    stats?: Partial<SyncStats>,
    errors?: SyncError[],
  ): SyncResultDto {
    const completedAt = new Date();
    const defaultStats: SyncStats = {
      created: 0,
      updated: 0,
      failed: 0,
      total: 0,
      ...stats,
    };

    return new SyncResultDto({
      success: false,
      message: `Synchronization failed: ${error}`,
      stats: defaultStats,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      errors: errors || [{ error }],
    });
  }
}
