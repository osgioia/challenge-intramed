import {
  isValidUrl,
  isValidSwapiUrl,
  validateUrlArray,
  parseSwapiDate,
  validateRequiredSwapiFields,
  mapSwapiFilmToMovie,
  mapSwapiFilmsToMovies,
} from './swapi-movie.mapper';
import { SwapiFilmPropertiesDto } from '../dto/swapi-film.dto';

describe('SwapiMovieMapper', () => {
  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://www.swapi.tech/api/people/1/')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('://invalid')).toBe(false);
    });
  });

  describe('isValidSwapiUrl', () => {
    it('should return true for valid SWAPI URLs', () => {
      expect(isValidSwapiUrl('https://www.swapi.tech/api/people/1/')).toBe(
        true,
      );
      expect(isValidSwapiUrl('https://swapi.tech/api/films/1/')).toBe(true);
    });

    it('should return false for non-SWAPI URLs', () => {
      expect(isValidSwapiUrl('https://www.example.com')).toBe(false);
      expect(isValidSwapiUrl('https://google.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidSwapiUrl('not-a-url')).toBe(false);
      expect(isValidSwapiUrl('')).toBe(false);
    });
  });

  describe('validateUrlArray', () => {
    it('should separate valid and invalid URLs', () => {
      const urls = [
        'https://www.swapi.tech/api/people/1/',
        'https://example.com',
        'https://swapi.tech/api/planets/1/',
        'invalid-url',
      ];

      const result = validateUrlArray(urls);

      expect(result.valid).toEqual([
        'https://www.swapi.tech/api/people/1/',
        'https://swapi.tech/api/planets/1/',
      ]);
      expect(result.invalid).toEqual(['https://example.com', 'invalid-url']);
    });

    it('should handle empty array', () => {
      const result = validateUrlArray([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it('should handle all valid URLs', () => {
      const urls = [
        'https://www.swapi.tech/api/people/1/',
        'https://swapi.tech/api/planets/1/',
      ];

      const result = validateUrlArray(urls);

      expect(result.valid).toEqual(urls);
      expect(result.invalid).toEqual([]);
    });

    it('should handle all invalid URLs', () => {
      const urls = ['invalid', 'https://example.com'];

      const result = validateUrlArray(urls);

      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(urls);
    });
  });

  describe('parseSwapiDate', () => {
    it('should parse ISO date strings correctly', () => {
      const isoDate = '2014-12-10T14:23:31.880000Z';
      const result = parseSwapiDate(isoDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2014-12-10T14:23:31.880Z');
    });

    it('should parse date-only strings correctly', () => {
      const dateOnly = '1977-05-25';
      const result = parseSwapiDate(dateOnly);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('1977-05-25T00:00:00.000Z');
    });

    it('should throw error for empty date string', () => {
      expect(() => parseSwapiDate('')).toThrow('Date string cannot be empty');
    });

    it('should throw error for invalid date format', () => {
      expect(() => parseSwapiDate('invalid-date')).toThrow(
        'Invalid date format',
      );
      expect(() => parseSwapiDate('25-05-1977')).toThrow('Invalid date format');
      expect(() => parseSwapiDate('1977/05/25')).toThrow('Invalid date format');
    });

    it('should throw error for invalid date values', () => {
      expect(() => parseSwapiDate('2023-13-32')).toThrow('Invalid date');
      expect(() => parseSwapiDate('2023-02-30')).toThrow('Invalid date');
    });

    it('should throw error for malformed ISO date', () => {
      expect(() => parseSwapiDate('2014-13-32T25:61:61.880Z')).toThrow(
        'Invalid ISO date string',
      );
    });
  });

  describe('validateRequiredSwapiFields', () => {
    const validSwapiFilm: SwapiFilmPropertiesDto = {
      title: 'A New Hope',
      episode_id: 4,
      opening_crawl: 'It is a period of civil war...',
      director: 'George Lucas',
      producer: 'Gary Kurtz, Rick McCallum',
      release_date: '1977-05-25',
      characters: ['https://www.swapi.tech/api/people/1/'],
      planets: ['https://www.swapi.tech/api/planets/1/'],
      starships: ['https://www.swapi.tech/api/starships/2/'],
      vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
      species: ['https://www.swapi.tech/api/species/1/'],
      created: '2014-12-10T14:23:31.880000Z',
      edited: '2014-12-20T19:49:45.256000Z',
      url: 'https://www.swapi.tech/api/films/1/',
    };

    it('should return no errors for valid film data', () => {
      const errors = validateRequiredSwapiFields(validSwapiFilm);
      expect(errors).toEqual([]);
    });

    it('should return error for missing title', () => {
      const filmData = { ...validSwapiFilm, title: '' };
      const errors = validateRequiredSwapiFields(filmData);
      expect(errors).toContain('Title is required');
    });

    it('should return error for invalid episode_id', () => {
      const filmData = { ...validSwapiFilm, episode_id: 0 };
      const errors = validateRequiredSwapiFields(filmData);
      expect(errors).toContain('Episode ID must be a positive number');

      const filmData2 = { ...validSwapiFilm, episode_id: -1 };
      const errors2 = validateRequiredSwapiFields(filmData2);
      expect(errors2).toContain('Episode ID must be a positive number');
    });

    it('should return error for missing opening_crawl', () => {
      const filmData = { ...validSwapiFilm, opening_crawl: '   ' };
      const errors = validateRequiredSwapiFields(filmData);
      expect(errors).toContain('Opening crawl is required');
    });

    it('should return error for missing director', () => {
      const filmData = { ...validSwapiFilm, director: '' };
      const errors = validateRequiredSwapiFields(filmData);
      expect(errors).toContain('Director is required');
    });

    it('should return error for missing producer', () => {
      const filmData = { ...validSwapiFilm, producer: '' };
      const errors = validateRequiredSwapiFields(filmData);
      expect(errors).toContain('Producer is required');
    });

    it('should return error for missing release_date', () => {
      const filmData = { ...validSwapiFilm, release_date: '' };
      const errors = validateRequiredSwapiFields(filmData);
      expect(errors).toContain('Release date is required');
    });

    it('should return multiple errors for multiple missing fields', () => {
      const filmData = {
        ...validSwapiFilm,
        title: '',
        director: '',
        episode_id: 0,
      };
      const errors = validateRequiredSwapiFields(filmData);
      expect(errors).toHaveLength(3);
      expect(errors).toContain('Title is required');
      expect(errors).toContain('Director is required');
      expect(errors).toContain('Episode ID must be a positive number');
    });
  });

  describe('mapSwapiFilmToMovie', () => {
    const validSwapiFilm: SwapiFilmPropertiesDto = {
      title: 'A New Hope',
      episode_id: 4,
      opening_crawl: 'It is a period of civil war...',
      director: 'George Lucas',
      producer: 'Gary Kurtz, Rick McCallum',
      release_date: '1977-05-25',
      characters: ['https://www.swapi.tech/api/people/1/'],
      planets: ['https://www.swapi.tech/api/planets/1/'],
      starships: ['https://www.swapi.tech/api/starships/2/'],
      vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
      species: ['https://www.swapi.tech/api/species/1/'],
      created: '2014-12-10T14:23:31.880000Z',
      edited: '2014-12-20T19:49:45.256000Z',
      url: 'https://www.swapi.tech/api/films/1/',
    };

    it('should successfully map valid SWAPI film to movie format', () => {
      const result = mapSwapiFilmToMovie(validSwapiFilm);

      expect(result).toEqual({
        title: 'A New Hope',
        episodeId: 4,
        openingCrawl: 'It is a period of civil war...',
        director: 'George Lucas',
        producer: 'Gary Kurtz, Rick McCallum',
        releaseDate: new Date('1977-05-25T00:00:00.000Z'),
        characters: ['https://www.swapi.tech/api/people/1/'],
        planets: ['https://www.swapi.tech/api/planets/1/'],
        starships: ['https://www.swapi.tech/api/starships/2/'],
        vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
        species: ['https://www.swapi.tech/api/species/1/'],
        swapiUrl: 'https://www.swapi.tech/api/films/1/',
      });
    });

    it('should trim whitespace from string fields', () => {
      const filmWithWhitespace = {
        ...validSwapiFilm,
        title: '  A New Hope  ',
        director: '  George Lucas  ',
        producer: '  Gary Kurtz, Rick McCallum  ',
        opening_crawl: '  It is a period of civil war...  ',
      };

      const result = mapSwapiFilmToMovie(filmWithWhitespace);

      expect(result.title).toBe('A New Hope');
      expect(result.director).toBe('George Lucas');
      expect(result.producer).toBe('Gary Kurtz, Rick McCallum');
      expect(result.openingCrawl).toBe('It is a period of civil war...');
    });

    it('should handle empty arrays', () => {
      const filmWithEmptyArrays = {
        ...validSwapiFilm,
        characters: [],
        planets: [],
        starships: [],
        vehicles: [],
        species: [],
      };

      const result = mapSwapiFilmToMovie(filmWithEmptyArrays);

      expect(result.characters).toEqual([]);
      expect(result.planets).toEqual([]);
      expect(result.starships).toEqual([]);
      expect(result.vehicles).toEqual([]);
      expect(result.species).toEqual([]);
    });

    it('should throw error for validation failures', () => {
      const invalidFilm = { ...validSwapiFilm, title: '' };

      expect(() => mapSwapiFilmToMovie(invalidFilm)).toThrow(
        'SWAPI film validation failed',
      );
    });

    it('should throw error for invalid release date', () => {
      const filmWithInvalidDate = {
        ...validSwapiFilm,
        release_date: 'invalid-date',
      };

      expect(() => mapSwapiFilmToMovie(filmWithInvalidDate)).toThrow(
        'Invalid release date in SWAPI film',
      );
    });

    it('should throw error for invalid URLs', () => {
      const filmWithInvalidUrls = {
        ...validSwapiFilm,
        characters: ['invalid-url', 'https://www.swapi.tech/api/people/1/'],
      };

      expect(() => mapSwapiFilmToMovie(filmWithInvalidUrls)).toThrow(
        'Invalid URLs found in SWAPI film data',
      );
    });

    it('should throw error for invalid main SWAPI URL', () => {
      const filmWithInvalidSwapiUrl = {
        ...validSwapiFilm,
        url: 'https://example.com',
      };

      expect(() => mapSwapiFilmToMovie(filmWithInvalidSwapiUrl)).toThrow(
        'Invalid SWAPI URL',
      );
    });

    it('should filter out invalid URLs and keep valid ones', () => {
      const filmWithMixedUrls = {
        ...validSwapiFilm,
        characters: [
          'https://www.swapi.tech/api/people/1/',
          'https://example.com', // invalid
          'https://swapi.tech/api/people/2/',
        ],
      };

      expect(() => mapSwapiFilmToMovie(filmWithMixedUrls)).toThrow(
        'Invalid URLs found in SWAPI film data',
      );
    });
  });

  describe('mapSwapiFilmsToMovies', () => {
    const validSwapiFilm1: SwapiFilmPropertiesDto = {
      title: 'A New Hope',
      episode_id: 4,
      opening_crawl: 'It is a period of civil war...',
      director: 'George Lucas',
      producer: 'Gary Kurtz, Rick McCallum',
      release_date: '1977-05-25',
      characters: ['https://www.swapi.tech/api/people/1/'],
      planets: ['https://www.swapi.tech/api/planets/1/'],
      starships: ['https://www.swapi.tech/api/starships/2/'],
      vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
      species: ['https://www.swapi.tech/api/species/1/'],
      created: '2014-12-10T14:23:31.880000Z',
      edited: '2014-12-20T19:49:45.256000Z',
      url: 'https://www.swapi.tech/api/films/1/',
    };

    const validSwapiFilm2: SwapiFilmPropertiesDto = {
      title: 'The Empire Strikes Back',
      episode_id: 5,
      opening_crawl: 'It is a dark time for the Rebellion...',
      director: 'Irvin Kershner',
      producer: 'Gary Kurtz, Rick McCallum',
      release_date: '1980-05-17',
      characters: ['https://www.swapi.tech/api/people/1/'],
      planets: ['https://www.swapi.tech/api/planets/4/'],
      starships: ['https://www.swapi.tech/api/starships/3/'],
      vehicles: ['https://www.swapi.tech/api/vehicles/8/'],
      species: ['https://www.swapi.tech/api/species/1/'],
      created: '2014-12-12T11:26:24.656000Z',
      edited: '2014-12-15T13:07:53.386000Z',
      url: 'https://www.swapi.tech/api/films/2/',
    };

    it('should successfully map multiple valid SWAPI films', () => {
      const result = mapSwapiFilmsToMovies([validSwapiFilm1, validSwapiFilm2]);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('A New Hope');
      expect(result[0].episodeId).toBe(4);
      expect(result[1].title).toBe('The Empire Strikes Back');
      expect(result[1].episodeId).toBe(5);
    });

    it('should handle empty array', () => {
      const result = mapSwapiFilmsToMovies([]);
      expect(result).toEqual([]);
    });

    it('should throw error with index information for invalid film', () => {
      const invalidFilm = { ...validSwapiFilm1, title: '' };
      const films = [validSwapiFilm1, invalidFilm, validSwapiFilm2];

      expect(() => mapSwapiFilmsToMovies(films)).toThrow(
        'Failed to map SWAPI film at index 1',
      );
    });

    it('should stop at first invalid film and provide detailed error', () => {
      const invalidFilm = { ...validSwapiFilm1, release_date: 'invalid-date' };
      const films = [validSwapiFilm1, invalidFilm];

      expect(() => mapSwapiFilmsToMovies(films)).toThrow(
        'Failed to map SWAPI film at index 1',
      );
    });
  });
});
