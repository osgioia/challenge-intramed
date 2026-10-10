import { SwapiFilmPropertiesDto } from '../dto/swapi-film.dto';
import { CreateMovieData } from '../../movies/domain/movie';

/**
 * Validates that a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a string is a valid SWAPI URL (must contain swapi.tech domain)
 */
export function isValidSwapiUrl(url: string): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'www.swapi.tech' || urlObj.hostname === 'swapi.tech'
    );
  } catch {
    return false;
  }
}

/**
 * Validates an array of URLs
 */
export function validateUrlArray(urls: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  urls.forEach((url) => {
    if (isValidSwapiUrl(url)) {
      valid.push(url);
    } else {
      invalid.push(url);
    }
  });

  return { valid, invalid };
}

/**
 * Parses a date string and returns a Date object
 * Handles both ISO date strings and date-only strings (YYYY-MM-DD)
 */
export function parseSwapiDate(dateString: string): Date {
  if (!dateString) {
    throw new Error('Date string cannot be empty');
  }

  // Handle ISO date strings (with time)
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ISO date string: ${dateString}`);
    }
    return date;
  }

  // Handle date-only strings (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new Error(
      `Invalid date format: ${dateString}. Expected YYYY-MM-DD or ISO date string`,
    );
  }

  // Additional validation for date components
  const [year, month, day] = dateString.split('-').map(Number);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid date: ${dateString}`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  // Create date and validate it matches input (catches invalid dates like Feb 30)
  const date = new Date(dateString + 'T00:00:00.000Z');
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  // Additional check: ensure the date components match what we parsed
  // This catches cases like 2023-02-30 which JS converts to 2023-03-02
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
}

/**
 * Validates that required fields are present and not empty
 */
export function validateRequiredSwapiFields(
  swapiFilm: SwapiFilmPropertiesDto,
): string[] {
  const errors: string[] = [];

  if (!swapiFilm.title || swapiFilm.title.trim() === '') {
    errors.push('Title is required');
  }

  if (typeof swapiFilm.episode_id !== 'number' || swapiFilm.episode_id <= 0) {
    errors.push('Episode ID must be a positive number');
  }

  if (!swapiFilm.opening_crawl || swapiFilm.opening_crawl.trim() === '') {
    errors.push('Opening crawl is required');
  }

  if (!swapiFilm.director || swapiFilm.director.trim() === '') {
    errors.push('Director is required');
  }

  if (!swapiFilm.producer || swapiFilm.producer.trim() === '') {
    errors.push('Producer is required');
  }

  if (!swapiFilm.release_date || swapiFilm.release_date.trim() === '') {
    errors.push('Release date is required');
  }

  return errors;
}

/**
 * Maps a SWAPI film response to internal Movie format
 */
export function mapSwapiFilmToMovie(
  swapiFilm: SwapiFilmPropertiesDto,
): CreateMovieData {
  // Validate required fields
  const validationErrors = validateRequiredSwapiFields(swapiFilm);
  if (validationErrors.length > 0) {
    throw new Error(
      `SWAPI film validation failed: ${validationErrors.join(', ')}`,
    );
  }

  // Parse and validate date
  let releaseDate: Date;
  try {
    releaseDate = parseSwapiDate(swapiFilm.release_date);
  } catch (error) {
    throw new Error(`Invalid release date in SWAPI film: ${error.message}`);
  }

  // Validate URL arrays
  const charactersValidation = validateUrlArray(swapiFilm.characters || []);
  const planetsValidation = validateUrlArray(swapiFilm.planets || []);
  const starshipsValidation = validateUrlArray(swapiFilm.starships || []);
  const vehiclesValidation = validateUrlArray(swapiFilm.vehicles || []);
  const speciesValidation = validateUrlArray(swapiFilm.species || []);

  // Collect all invalid URLs for error reporting
  const allInvalidUrls = [
    ...charactersValidation.invalid,
    ...planetsValidation.invalid,
    ...starshipsValidation.invalid,
    ...vehiclesValidation.invalid,
    ...speciesValidation.invalid,
  ];

  if (allInvalidUrls.length > 0) {
    throw new Error(
      `Invalid URLs found in SWAPI film data: ${allInvalidUrls.join(', ')}`,
    );
  }

  // Validate main SWAPI URL if provided
  if (swapiFilm.url && !isValidSwapiUrl(swapiFilm.url)) {
    throw new Error(`Invalid SWAPI URL: ${swapiFilm.url}`);
  }

  return {
    title: swapiFilm.title.trim(),
    episodeId: swapiFilm.episode_id,
    openingCrawl: swapiFilm.opening_crawl.trim(),
    director: swapiFilm.director.trim(),
    producer: swapiFilm.producer.trim(),
    releaseDate,
    characters: charactersValidation.valid,
    planets: planetsValidation.valid,
    starships: starshipsValidation.valid,
    vehicles: vehiclesValidation.valid,
    species: speciesValidation.valid,
    swapiUrl: swapiFilm.url,
  };
}

/**
 * Maps multiple SWAPI films to internal Movie format
 */
export function mapSwapiFilmsToMovies(
  swapiFilms: SwapiFilmPropertiesDto[],
): CreateMovieData[] {
  return swapiFilms.map((swapiFilm, index) => {
    try {
      return mapSwapiFilmToMovie(swapiFilm);
    } catch (error) {
      throw new Error(
        `Failed to map SWAPI film at index ${index}: ${error.message}`,
      );
    }
  });
}
