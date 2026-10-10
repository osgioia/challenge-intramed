import { Movie, CreateMovieData } from '../../../../domain/movie';
import { MovieEntity } from '../entities/movie.entity';

export class MovieMapper {
  static toDomain(raw: MovieEntity): Movie {
    const movieData: CreateMovieData = {
      id: raw.id,
      title: raw.title,
      episodeId: raw.episodeId,
      openingCrawl: raw.openingCrawl,
      director: raw.director,
      producer: raw.producer,
      releaseDate: raw.releaseDate,
      characters: raw.characters || [],
      planets: raw.planets || [],
      starships: raw.starships || [],
      vehicles: raw.vehicles || [],
      species: raw.species || [],
      swapiUrl: raw.swapiUrl,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return new Movie(movieData);
  }

  static toPersistence(domainEntity: Movie): MovieEntity {
    const persistenceEntity = new MovieEntity();

    if (domainEntity.id !== undefined) {
      persistenceEntity.id = domainEntity.id as number;
    }

    persistenceEntity.title = domainEntity.title;
    persistenceEntity.episodeId = domainEntity.episodeId;
    persistenceEntity.openingCrawl = domainEntity.openingCrawl;
    persistenceEntity.director = domainEntity.director;
    persistenceEntity.producer = domainEntity.producer;
    persistenceEntity.releaseDate = domainEntity.releaseDate;
    persistenceEntity.characters = domainEntity.characters;
    persistenceEntity.planets = domainEntity.planets;
    persistenceEntity.starships = domainEntity.starships;
    persistenceEntity.vehicles = domainEntity.vehicles;
    persistenceEntity.species = domainEntity.species;
    persistenceEntity.swapiUrl = domainEntity.swapiUrl;

    if (domainEntity.createdAt) {
      persistenceEntity.createdAt = domainEntity.createdAt;
    }

    if (domainEntity.updatedAt) {
      persistenceEntity.updatedAt = domainEntity.updatedAt;
    }

    return persistenceEntity;
  }

  static toDomainArray(raw: MovieEntity[]): Movie[] {
    return raw.map((entity) => this.toDomain(entity));
  }

  static toPersistenceArray(domainEntities: Movie[]): MovieEntity[] {
    return domainEntities.map((entity) => this.toPersistence(entity));
  }
}
