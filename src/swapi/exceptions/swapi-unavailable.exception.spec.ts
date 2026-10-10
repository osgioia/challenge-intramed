import { ServiceUnavailableException } from '@nestjs/common';
import { SwapiUnavailableException } from './swapi-unavailable.exception';

describe('SwapiUnavailableException', () => {
  it('should be a ServiceUnavailableException', () => {
    const exception = new SwapiUnavailableException();

    expect(exception).toBeInstanceOf(ServiceUnavailableException);
  });

  it('should return HTTP 503 with the default message', () => {
    const exception = new SwapiUnavailableException();

    expect(exception.getStatus()).toBe(503);
    expect(exception.getResponse()).toEqual({
      status: 503,
      error: 'swapiUnavailable',
      message: 'Star Wars API is currently unavailable',
    });
  });

  it('should allow a custom message', () => {
    const exception = new SwapiUnavailableException('Failed to fetch films');

    expect(exception.getStatus()).toBe(503);
    expect(exception.getResponse()).toEqual(
      expect.objectContaining({
        status: 503,
        error: 'swapiUnavailable',
        message: 'Failed to fetch films',
      }),
    );
  });
});
