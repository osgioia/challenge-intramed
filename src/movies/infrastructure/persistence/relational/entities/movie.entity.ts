import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'movie',
})
export class MovieEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_movie_title')
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Index('IDX_movie_episode_id')
  @Column({ name: 'episode_id', type: 'int', unique: true })
  episodeId: number;

  @Column({ name: 'opening_crawl', type: 'text' })
  openingCrawl: string;

  @Column({ type: 'varchar', length: 255 })
  director: string;

  @Column({ type: 'varchar', length: 500 })
  producer: string;

  @Index('IDX_movie_release_date')
  @Column({ name: 'release_date', type: 'date' })
  releaseDate: Date;

  @Column({ type: 'json', default: [] })
  characters: string[];

  @Column({ type: 'json', default: [] })
  planets: string[];

  @Column({ type: 'json', default: [] })
  starships: string[];

  @Column({ type: 'json', default: [] })
  vehicles: string[];

  @Column({ type: 'json', default: [] })
  species: string[];

  @Index('IDX_movie_swapi_url')
  @Column({
    name: 'swapi_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    unique: true,
  })
  swapiUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
