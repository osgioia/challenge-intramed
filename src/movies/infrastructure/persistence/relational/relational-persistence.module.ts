import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovieRepository } from '../movie.repository';
import { MoviesRelationalRepository } from './repositories/movies.repository';
import { MovieEntity } from './entities/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MovieEntity])],
  providers: [
    {
      provide: MovieRepository,
      useClass: MoviesRelationalRepository,
    },
  ],
  exports: [MovieRepository, TypeOrmModule],
})
export class RelationalMoviePersistenceModule {}
