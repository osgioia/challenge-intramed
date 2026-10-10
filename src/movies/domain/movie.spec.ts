import { Movie, CreateMovieData, UpdateMovieData } from './movie';
import { MovieDomainError } from './types';

describe('Movie Domain Entity', () => {
  const validMovieData: CreateMovieData = {
    title: 'A New Hope',
    episodeId: 4,
    openingCrawl: 'It is a period of civil war...',
    director: 'George Lucas',
    producer: 'Gary Kurtz, Rick McCallum',
    releaseDate: '1977-05-25',
    characters: ['https://www.swapi.tech/api/people/1/'],
    planets: ['https://www.swapi.tech/api/planets/1/'],
    starships: ['https://www.swapi.tech/api/starships/2/'],
    vehicles: ['https://www.swapi.tech/api/vehicles/4/'],
    species: ['https://www.swapi.tech/api/species/1/'],
    swapiUrl: 'https://www.swapi.tech/api/films/1/',
  };

  describe('Constructor Validation', () => {
    describe('Title Validation', () => {
      it('should create movie with valid title', () => {
        const movie = new Movie(validMovieData);
        expect(movie.title).toBe('A New Hope');
      });

      it('should throw error for empty title', () => {
        const invalidData = { ...validMovieData, title: '' };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
        expect(() => new Movie(invalidData)).toThrow('Movie validation failed');
      });

      it('should throw error for whitespace-only title', () => {
        const invalidData = { ...validMovieData, title: '   ' };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should throw error for title exceeding 255 characters', () => {
        const longTitle = 'a'.repeat(256);
        const invalidData = { ...validMovieData, title: longTitle };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should trim title whitespace', () => {
        const dataWithWhitespace = {
          ...validMovieData,
          title: '  A New Hope  ',
        };
        const movie = new Movie(dataWithWhitespace);
        expect(movie.title).toBe('A New Hope');
      });
    });

    describe('Episode ID Validation', () => {
      it('should create movie with valid episode ID', () => {
        const movie = new Movie(validMovieData);
        expect(movie.episodeId).toBe(4);
      });

      it('should throw error for zero episode ID', () => {
        const invalidData = { ...validMovieData, episodeId: 0 };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should throw error for negative episode ID', () => {
        const invalidData = { ...validMovieData, episodeId: -1 };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should throw error for non-integer episode ID', () => {
        const invalidData = { ...validMovieData, episodeId: 4.5 };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });
    });

    describe('Opening Crawl Validation', () => {
      it('should create movie with valid opening crawl', () => {
        const movie = new Movie(validMovieData);
        expect(movie.openingCrawl).toBe('It is a period of civil war...');
      });

      it('should throw error for empty opening crawl', () => {
        const invalidData = { ...validMovieData, openingCrawl: '' };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should trim opening crawl whitespace', () => {
        const dataWithWhitespace = {
          ...validMovieData,
          openingCrawl: '  It is a period of civil war...  ',
        };
        const movie = new Movie(dataWithWhitespace);
        expect(movie.openingCrawl).toBe('It is a period of civil war...');
      });
    });

    describe('Director Validation', () => {
      it('should create movie with valid director', () => {
        const movie = new Movie(validMovieData);
        expect(movie.director).toBe('George Lucas');
      });

      it('should throw error for empty director', () => {
        const invalidData = { ...validMovieData, director: '' };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should throw error for director exceeding 255 characters', () => {
        const longDirector = 'a'.repeat(256);
        const invalidData = { ...validMovieData, director: longDirector };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });
    });

    describe('Producer Validation', () => {
      it('should create movie with valid producer', () => {
        const movie = new Movie(validMovieData);
        expect(movie.producer).toBe('Gary Kurtz, Rick McCallum');
      });

      it('should throw error for empty producer', () => {
        const invalidData = { ...validMovieData, producer: '' };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should throw error for producer exceeding 500 characters', () => {
        const longProducer = 'a'.repeat(501);
        const invalidData = { ...validMovieData, producer: longProducer };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });
    });

    describe('Release Date Validation', () => {
      it('should create movie with valid release date string', () => {
        const movie = new Movie(validMovieData);
        expect(movie.releaseDate).toEqual(new Date('1977-05-25'));
      });

      it('should create movie with valid Date object', () => {
        const dateData = {
          ...validMovieData,
          releaseDate: new Date('1977-05-25'),
        };
        const movie = new Movie(dateData);
        expect(movie.releaseDate).toEqual(new Date('1977-05-25'));
      });

      it('should throw error for invalid date string', () => {
        const invalidData = { ...validMovieData, releaseDate: 'invalid-date' };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });

      it('should throw error for null release date', () => {
        const invalidData = { ...validMovieData, releaseDate: null as any };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });
    });

    describe('Array Field Validation', () => {
      const arrayFields = [
        'characters',
        'planets',
        'starships',
        'vehicles',
        'species',
      ];

      arrayFields.forEach((fieldName) => {
        describe(`${fieldName} validation`, () => {
          it(`should create movie with valid ${fieldName} array`, () => {
            const movie = new Movie(validMovieData);
            expect(Array.isArray(movie[fieldName as keyof Movie])).toBe(true);
          });

          it(`should throw error for non-array ${fieldName}`, () => {
            const invalidData = {
              ...validMovieData,
              [fieldName]: 'not-an-array',
            };
            expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
          });

          it(`should throw error for ${fieldName} with non-string items`, () => {
            const invalidData = {
              ...validMovieData,
              [fieldName]: [123, 'valid-url'],
            };
            expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
          });

          it(`should throw error for ${fieldName} with invalid URLs`, () => {
            const invalidData = {
              ...validMovieData,
              [fieldName]: ['invalid-url'],
            };
            expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
          });

          it(`should create immutable copy of ${fieldName} array`, () => {
            const originalArray = validMovieData[
              fieldName as keyof CreateMovieData
            ] as string[];
            const movie = new Movie(validMovieData);
            const movieArray = movie[fieldName as keyof Movie] as string[];

            expect(movieArray).not.toBe(originalArray);
            expect(movieArray).toEqual(originalArray);
          });
        });
      });
    });

    describe('SWAPI URL Validation', () => {
      it('should create movie with valid SWAPI URL', () => {
        const movie = new Movie(validMovieData);
        expect(movie.swapiUrl).toBe('https://www.swapi.tech/api/films/1/');
      });

      it('should create movie without SWAPI URL', () => {
        const dataWithoutSwapi = { ...validMovieData };
        delete dataWithoutSwapi.swapiUrl;
        const movie = new Movie(dataWithoutSwapi);
        expect(movie.swapiUrl).toBeUndefined();
      });

      it('should throw error for invalid SWAPI URL', () => {
        const invalidData = { ...validMovieData, swapiUrl: 'invalid-url' };
        expect(() => new Movie(invalidData)).toThrow(MovieDomainError);
      });
    });
  });

  describe('Update Method', () => {
    let movie: Movie;

    beforeEach(() => {
      movie = new Movie(validMovieData);
    });

    it('should update title successfully', () => {
      const updateData: UpdateMovieData = { title: 'The Empire Strikes Back' };
      movie.update(updateData);
      expect(movie.title).toBe('The Empire Strikes Back');
      expect(movie.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid title update', () => {
      const updateData: UpdateMovieData = { title: '' };
      expect(() => movie.update(updateData)).toThrow(MovieDomainError);
    });

    it('should update episode ID successfully', () => {
      const updateData: UpdateMovieData = { episodeId: 5 };
      movie.update(updateData);
      expect(movie.episodeId).toBe(5);
    });

    it('should throw error for invalid episode ID update', () => {
      const updateData: UpdateMovieData = { episodeId: -1 };
      expect(() => movie.update(updateData)).toThrow(MovieDomainError);
    });

    it('should update multiple fields successfully', () => {
      const updateData: UpdateMovieData = {
        title: 'Updated Title',
        episodeId: 6,
        director: 'Updated Director',
      };
      movie.update(updateData);
      expect(movie.title).toBe('Updated Title');
      expect(movie.episodeId).toBe(6);
      expect(movie.director).toBe('Updated Director');
    });

    it('should update arrays successfully', () => {
      const updateData: UpdateMovieData = {
        characters: ['https://www.swapi.tech/api/people/2/'],
      };
      movie.update(updateData);
      expect(movie.characters).toEqual([
        'https://www.swapi.tech/api/people/2/',
      ]);
    });

    it('should throw error for invalid array update', () => {
      const updateData: UpdateMovieData = {
        characters: ['invalid-url'] as any,
      };
      expect(() => movie.update(updateData)).toThrow(MovieDomainError);
    });

    it('should not update fields not provided in update data', () => {
      const originalTitle = movie.title;
      const updateData: UpdateMovieData = { episodeId: 7 };
      movie.update(updateData);
      expect(movie.title).toBe(originalTitle);
      expect(movie.episodeId).toBe(7);
    });
  });

  describe('Utility Methods', () => {
    let movie: Movie;

    beforeEach(() => {
      movie = new Movie({
        ...validMovieData,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    describe('toJSON', () => {
      it('should return JSON representation of movie', () => {
        const json = movie.toJSON();
        expect(json.title).toBe(movie.title);
        expect(json.episodeId).toBe(movie.episodeId);
        expect(json.id).toBe(movie.id);
        expect(Array.isArray(json.characters)).toBe(true);
      });

      it('should return immutable arrays in JSON', () => {
        const json = movie.toJSON();
        expect(json.characters).not.toBe(movie.characters);
        expect(json.characters).toEqual(movie.characters);
      });
    });

    describe('static create', () => {
      it('should create movie instance', () => {
        const createdMovie = Movie.create(validMovieData);
        expect(createdMovie).toBeInstanceOf(Movie);
        expect(createdMovie.title).toBe(validMovieData.title);
      });
    });

    describe('clone', () => {
      it('should create a deep copy of the movie', () => {
        const clonedMovie = movie.clone();
        expect(clonedMovie).not.toBe(movie);
        expect(clonedMovie.title).toBe(movie.title);
        expect(clonedMovie.characters).not.toBe(movie.characters);
        expect(clonedMovie.characters).toEqual(movie.characters);
      });
    });

    describe('equals', () => {
      it('should return true for movies with same id, title, episodeId, and swapiUrl', () => {
        const otherMovie = new Movie({
          ...validMovieData,
          id: movie.id,
          title: movie.title,
          episodeId: movie.episodeId,
          swapiUrl: movie.swapiUrl,
        });
        expect(movie.equals(otherMovie)).toBe(true);
      });

      it('should return false for movies with different ids', () => {
        const otherMovie = new Movie({ ...validMovieData, id: 999 });
        expect(movie.equals(otherMovie)).toBe(false);
      });

      it('should return false for movies with different titles', () => {
        const otherMovie = new Movie({
          ...validMovieData,
          id: movie.id,
          title: 'Different Title',
        });
        expect(movie.equals(otherMovie)).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays for URL fields', () => {
      const dataWithEmptyArrays = {
        ...validMovieData,
        characters: [],
        planets: [],
        starships: [],
        vehicles: [],
        species: [],
      };
      const movie = new Movie(dataWithEmptyArrays);
      expect(movie.characters).toEqual([]);
      expect(movie.planets).toEqual([]);
    });

    it('should handle very long opening crawl', () => {
      const longCrawl = 'a'.repeat(10000);
      const dataWithLongCrawl = { ...validMovieData, openingCrawl: longCrawl };
      const movie = new Movie(dataWithLongCrawl);
      expect(movie.openingCrawl).toBe(longCrawl);
    });

    it('should handle future release dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      const dataWithFutureDate = { ...validMovieData, releaseDate: futureDate };
      const movie = new Movie(dataWithFutureDate);
      expect(movie.releaseDate).toEqual(futureDate);
    });

    it('should preserve timestamps if provided', () => {
      const createdAt = new Date('2020-01-01');
      const updatedAt = new Date('2021-01-01');
      const dataWithTimestamps = { ...validMovieData, createdAt, updatedAt };
      const movie = new Movie(dataWithTimestamps);
      expect(movie.createdAt).toEqual(createdAt);
      expect(movie.updatedAt).toEqual(updatedAt);
    });
  });
});
