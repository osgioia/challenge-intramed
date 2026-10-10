import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateMovieDto } from './create-movie.dto';

describe('CreateMovieDto', () => {
  const validMovieData = {
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
    planets: [
      'https://swapi.dev/api/planets/1/',
      'https://swapi.dev/api/planets/2/',
    ],
    starships: [
      'https://swapi.dev/api/starships/2/',
      'https://swapi.dev/api/starships/3/',
    ],
    vehicles: [
      'https://swapi.dev/api/vehicles/4/',
      'https://swapi.dev/api/vehicles/6/',
    ],
    species: [
      'https://swapi.dev/api/species/1/',
      'https://swapi.dev/api/species/2/',
    ],
    swapiUrl: 'https://swapi.dev/api/films/1/',
  };

  describe('title validation', () => {
    it('should pass with valid title', async () => {
      const dto = plainToInstance(CreateMovieDto, validMovieData);
      const errors = await validate(dto);

      const titleErrors = errors.filter((error) => error.property === 'title');
      expect(titleErrors).toHaveLength(0);
    });

    it('should fail with empty title', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        title: '',
      });
      const errors = await validate(dto);

      const titleErrors = errors.filter((error) => error.property === 'title');
      expect(titleErrors).toHaveLength(1);
    });

    it('should fail with title exceeding 255 characters', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        title: 'a'.repeat(256),
      });
      const errors = await validate(dto);

      const titleErrors = errors.filter((error) => error.property === 'title');
      expect(titleErrors).toHaveLength(1);
    });

    it('should trim whitespace from title', () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        title: '  A New Hope  ',
      });

      expect(dto.title).toBe('A New Hope');
    });
  });

  describe('episodeId validation', () => {
    it('should pass with valid episode ID', async () => {
      const dto = plainToInstance(CreateMovieDto, validMovieData);
      const errors = await validate(dto);

      const episodeErrors = errors.filter(
        (error) => error.property === 'episodeId',
      );
      expect(episodeErrors).toHaveLength(0);
    });

    it('should fail with zero episode ID', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        episodeId: 0,
      });
      const errors = await validate(dto);

      const episodeErrors = errors.filter(
        (error) => error.property === 'episodeId',
      );
      expect(episodeErrors).toHaveLength(1);
    });

    it('should fail with negative episode ID', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        episodeId: -1,
      });
      const errors = await validate(dto);

      const episodeErrors = errors.filter(
        (error) => error.property === 'episodeId',
      );
      expect(episodeErrors).toHaveLength(1);
    });

    it('should fail with non-integer episode ID', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        episodeId: 4.5,
      });
      const errors = await validate(dto);

      const episodeErrors = errors.filter(
        (error) => error.property === 'episodeId',
      );
      expect(episodeErrors).toHaveLength(1);
    });
  });

  describe('openingCrawl validation', () => {
    it('should pass with valid opening crawl', async () => {
      const dto = plainToInstance(CreateMovieDto, validMovieData);
      const errors = await validate(dto);

      const crawlErrors = errors.filter(
        (error) => error.property === 'openingCrawl',
      );
      expect(crawlErrors).toHaveLength(0);
    });

    it('should fail with empty opening crawl', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        openingCrawl: '',
      });
      const errors = await validate(dto);

      const crawlErrors = errors.filter(
        (error) => error.property === 'openingCrawl',
      );
      expect(crawlErrors).toHaveLength(1);
    });

    it('should trim whitespace from opening crawl', () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        openingCrawl: '  It is a period of civil war...  ',
      });

      expect(dto.openingCrawl).toBe('It is a period of civil war...');
    });
  });

  describe('director validation', () => {
    it('should pass with valid director', async () => {
      const dto = plainToInstance(CreateMovieDto, validMovieData);
      const errors = await validate(dto);

      const directorErrors = errors.filter(
        (error) => error.property === 'director',
      );
      expect(directorErrors).toHaveLength(0);
    });

    it('should fail with empty director', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        director: '',
      });
      const errors = await validate(dto);

      const directorErrors = errors.filter(
        (error) => error.property === 'director',
      );
      expect(directorErrors).toHaveLength(1);
    });

    it('should fail with director exceeding 255 characters', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
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
    it('should pass with valid producer', async () => {
      const dto = plainToInstance(CreateMovieDto, validMovieData);
      const errors = await validate(dto);

      const producerErrors = errors.filter(
        (error) => error.property === 'producer',
      );
      expect(producerErrors).toHaveLength(0);
    });

    it('should fail with empty producer', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        producer: '',
      });
      const errors = await validate(dto);

      const producerErrors = errors.filter(
        (error) => error.property === 'producer',
      );
      expect(producerErrors).toHaveLength(1);
    });

    it('should fail with producer exceeding 500 characters', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
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
    it('should pass with valid ISO date string', async () => {
      const dto = plainToInstance(CreateMovieDto, validMovieData);
      const errors = await validate(dto);

      const dateErrors = errors.filter(
        (error) => error.property === 'releaseDate',
      );
      expect(dateErrors).toHaveLength(0);
    });

    it('should fail with invalid date format', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        releaseDate: '25/05/1977',
      });
      const errors = await validate(dto);

      const dateErrors = errors.filter(
        (error) => error.property === 'releaseDate',
      );
      expect(dateErrors).toHaveLength(1);
    });

    it('should fail with invalid date', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        releaseDate: '1977-13-45',
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
        it(`should pass with valid ${field} array`, async () => {
          const dto = plainToInstance(CreateMovieDto, validMovieData);
          const errors = await validate(dto);

          const fieldErrors = errors.filter(
            (error) => error.property === field,
          );
          expect(fieldErrors).toHaveLength(0);
        });

        it(`should fail with empty ${field} array`, async () => {
          const dto = plainToInstance(CreateMovieDto, {
            ...validMovieData,
            [field]: [],
          });
          const errors = await validate(dto);

          const fieldErrors = errors.filter(
            (error) => error.property === field,
          );
          expect(fieldErrors).toHaveLength(1);
        });

        it(`should fail with invalid URL in ${field}`, async () => {
          const dto = plainToInstance(CreateMovieDto, {
            ...validMovieData,
            [field]: ['invalid-url'],
          });
          const errors = await validate(dto);

          const fieldErrors = errors.filter(
            (error) => error.property === field,
          );
          expect(fieldErrors).toHaveLength(1);
        });

        it(`should fail with non-array ${field}`, async () => {
          const dto = plainToInstance(CreateMovieDto, {
            ...validMovieData,
            [field]: 'not-an-array',
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
    it('should pass with valid SWAPI URL', async () => {
      const dto = plainToInstance(CreateMovieDto, validMovieData);
      const errors = await validate(dto);

      const urlErrors = errors.filter((error) => error.property === 'swapiUrl');
      expect(urlErrors).toHaveLength(0);
    });

    it('should pass without SWAPI URL (optional)', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        swapiUrl: undefined,
      });
      const errors = await validate(dto);

      const urlErrors = errors.filter((error) => error.property === 'swapiUrl');
      expect(urlErrors).toHaveLength(0);
    });

    it('should fail with invalid URL', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        swapiUrl: 'invalid-url',
      });
      const errors = await validate(dto);

      const urlErrors = errors.filter((error) => error.property === 'swapiUrl');
      expect(urlErrors).toHaveLength(1);
    });

    it('should fail with URL exceeding 500 characters', async () => {
      const dto = plainToInstance(CreateMovieDto, {
        ...validMovieData,
        swapiUrl: `https://swapi.dev/api/films/1/${'a'.repeat(500)}`,
      });
      const errors = await validate(dto);

      const urlErrors = errors.filter((error) => error.property === 'swapiUrl');
      expect(urlErrors).toHaveLength(1);
    });
  });
});
