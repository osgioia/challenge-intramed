import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';

export class SwapiUnavailableException extends ServiceUnavailableException {
  constructor(message?: string) {
    super({
      status: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'swapiUnavailable',
      message: message || 'Star Wars API is currently unavailable',
    });
  }
}
