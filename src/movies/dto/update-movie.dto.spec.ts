import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateMovieDto } from './update-movie.dto';

describe('UpdateMovieDto', () => {
  const validUpdateData = {
    title: 'A New Hope',
    episodeId: 4,
    openingCrawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    releaseDate: '1977-05-25',
    characters: [
      'https://swapi.dev/api/people/1/',
      'https://swapi.dev/api/people/2/',
    ],
    planets: ['https://swapi.dev/api/planets/1/'],
    starships: ['https://swapi.dev/api/starships/2/'],
    vehicles: ['https://swapi.dev/api/vehicles/4/'],
    species: ['https://swapi.dev/api/species/1/'],
    swapiUrl: 'https://swapi.dev/api/films/1/',
  };

  describe('partial update validation', () => {
    it('should pass with empty update data', async () => {
      const dto = plainToInstance(UpdateMovieDto, {});
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass with partial valid data', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        title: 'Updated Title',
        director: 'Updated Director',
      });
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass with all valid data', async () => {
      const dto = plainToInstance(UpdateMovieDto, validUpdateData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('title validation', () => {
    it('should fail with empty title when provided', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        title: '',
      });
      const errors = await validate(dto);

      const titleErrors = errors.filter((error) => error.property === 'title');
      expect(titleErrors).toHaveLength(1);
    });

    it('should fail with title exceeding 255 characters', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        title: 'a'.repeat(256),
      });
      const errors = await validate(dto);

      const titleErrors = errors.filter((error) => error.property === 'title');
      expect(titleErrors).toHaveLength(1);
    });

    it('should trim whitespace from title', () => {
      const dto = plainToInstance(UpdateMovieDto, {
        title: '  Updated Title  ',
      });

      expect(dto.title).toBe('Updated Title');
    });
  });

  describe('episodeId validation', () => {
    it('should fail with zero episode ID when provided', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        episodeId: 0,
      });
      const errors = await validate(dto);

      const episodeErrors = errors.filter(
        (error) => error.property === 'episodeId',
      );
      expect(episodeErrors).toHaveLength(1);
    });

    it('should fail with negative episode ID when provided', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        episodeId: -1,
      });
      const errors = await validate(dto);

      const episodeErrors = errors.filter(
        (error) => error.property === 'episodeId',
      );
      expect(episodeErrors).toHaveLength(1);
    });
  });

  describe('director validation', () => {
    it('should fail with empty director when provided', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        director: '',
      });
      const errors = await validate(dto);

      const directorErrors = errors.filter(
        (error) => error.property === 'director',
      );
      expect(directorErrors).toHaveLength(1);
    });

    it('should fail with director exceeding 255 characters', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        director: 'a'.repeat(256),
      });
      const errors = await validate(dto);

      const directorErrors = errors.filter(
        (error) => error.property === 'director',
      );
      expect(directorErrors).toHaveLength(1);
    });
  });

  describe('producer validation', () => {
    it('should fail with empty producer when provided', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        producer: '',
      });
      const errors = await validate(dto);

      const producerErrors = errors.filter(
        (error) => error.property === 'producer',
      );
      expect(producerErrors).toHaveLength(1);
    });

    it('should fail with producer exceeding 500 characters', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        producer: 'a'.repeat(501),
      });
      const errors = await validate(dto);

      const producerErrors = errors.filter(
        (error) => error.property === 'producer',
      );
      expect(producerErrors).toHaveLength(1);
    });
  });

  describe('releaseDate validation', () => {
    it('should fail with invalid date format when provided', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        releaseDate: '25/05/1977',
      });
      const errors = await validate(dto);

      const dateErrors = errors.filter(
        (error) => error.property === 'releaseDate',
      );
      expect(dateErrors).toHaveLength(1);
    });
  });

  describe('array field validations', () => {
    const arrayFields = [
      'characters',
      'planets',
      'starships',
      'vehicles',
      'species',
    ];

    arrayFields.forEach((field) => {
      describe(`${field} validation`, () => {
        it(`should fail with empty ${field} array when provided`, async () => {
          const dto = plainToInstance(UpdateMovieDto, {
            [field]: [],
          });
          const errors = await validate(dto);

          const fieldErrors = errors.filter(
            (error) => error.property === field,
          );
          expect(fieldErrors).toHaveLength(1);
        });

        it(`should fail with invalid URL in ${field} when provided`, async () => {
          const dto = plainToInstance(UpdateMovieDto, {
            [field]: ['invalid-url'],
          });
          const errors = await validate(dto);

          const fieldErrors = errors.filter(
            (error) => error.property === field,
          );
          expect(fieldErrors).toHaveLength(1);
        });
      });
    });
  });

  describe('swapiUrl validation', () => {
    it('should fail with invalid URL when provided', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        swapiUrl: 'invalid-url',
      });
      const errors = await validate(dto);

      const urlErrors = errors.filter((error) => error.property === 'swapiUrl');
      expect(urlErrors).toHaveLength(1);
    });

    it('should pass with null swapiUrl', async () => {
      const dto = plainToInstance(UpdateMovieDto, {
        swapiUrl: null,
      });
      const errors = await validate(dto);

      const urlErrors = errors.filter((error) => error.property === 'swapiUrl');
      expect(urlErrors).toHaveLength(0);
    });
  });

  describe('transformation validation', () => {
    it('should trim string fields', () => {
      const dto = plainToInstance(UpdateMovieDto, {
        title: '  Updated Title  ',
        director: '  Updated Director  ',
        producer: '  Updated Producer  ',
        openingCrawl: '  Updated Crawl  ',
      });

      expect(dto.title).toBe('Updated Title');
      expect(dto.director).toBe('Updated Director');
      expect(dto.producer).toBe('Updated Producer');
      expect(dto.openingCrawl).toBe('Updated Crawl');
    });
  });
});
