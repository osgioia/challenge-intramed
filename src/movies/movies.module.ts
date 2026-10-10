import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '../http.module';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { MovieEntity } from './infrastructure/persistence/relational/entities/movie.entity';
import { MoviesRelationalRepository } from './infrastructure/persistence/relational/repositories/movies.repository';
import { MovieRepository } from './infrastructure/persistence/movie.repository';
import { SwapiModule } from '../swapi/swapi.module';

@Module({
  imports: [TypeOrmModule.forFeature([MovieEntity]), HttpModule, SwapiModule],
  controllers: [MoviesController],
  providers: [
    MoviesService,
    {
      provide: MovieRepository,
      useClass: MoviesRelationalRepository,
    },
  ],
  exports: [MoviesService, MovieRepository],
})
export class MoviesModule {}
