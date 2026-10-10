import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMoviesTable1715028537218 implements MigrationInterface {
  name = 'CreateMoviesTable1715028537218';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movie" (
        "id" SERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "episode_id" integer NOT NULL,
        "opening_crawl" text NOT NULL,
        "director" character varying(255) NOT NULL,
        "producer" character varying(500) NOT NULL,
        "release_date" date NOT NULL,
        "characters" json NOT NULL DEFAULT '[]',
        "planets" json NOT NULL DEFAULT '[]',
        "starships" json NOT NULL DEFAULT '[]',
        "vehicles" json NOT NULL DEFAULT '[]',
        "species" json NOT NULL DEFAULT '[]',
        "swapi_url" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cb3bb4d61cf764dc035cbedd422" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_movie_title" ON "movie" ("title")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_movie_episode_id" ON "movie" ("episode_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_movie_release_date" ON "movie" ("release_date")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_movie_swapi_url" ON "movie" ("swapi_url")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_movie_episode_id" ON "movie" ("episode_id")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_movie_swapi_url" ON "movie" ("swapi_url") WHERE "swapi_url" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_movie_swapi_url"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_movie_episode_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_movie_swapi_url"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_movie_release_date"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_movie_episode_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_movie_title"`);
    await queryRunner.query(`DROP TABLE "movie"`);
  }
}
