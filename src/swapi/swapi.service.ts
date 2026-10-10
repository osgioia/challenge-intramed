import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { HttpService } from './http.service';
import {
  SwapiFilmDto,
  SwapiFilmsListDto,
  SwapiFilmPropertiesDto,
} from './dto/swapi-film.dto';
import { SwapiUnavailableException } from './exceptions/swapi-unavailable.exception';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class SwapiService {
  private readonly logger = new Logger(SwapiService.name);
  private readonly baseUrl: string;
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.baseUrl =
      this.configService.get<string>('swapi.baseUrl', { infer: true }) ??
      'https://www.swapi.tech/api';
    this.requestTimeout =
      this.configService.get<number>('swapi.requestTimeout', {
        infer: true,
      }) ?? 10000; // 10 seconds
  }

  async getAllFilms(): Promise<SwapiFilmPropertiesDto[]> {
    this.logger.log('Fetching all films from SWAPI');

    try {
      const filmsListResponse = await firstValueFrom<
        AxiosResponse<SwapiFilmsListDto>
      >(
        this.httpService.get<SwapiFilmsListDto>(`${this.baseUrl}/films`).pipe(
          timeout(this.requestTimeout),
          catchError((error: AxiosError) => {
            this.logger.error(
              `Failed to fetch films list from SWAPI: ${error.message}`,
              error.stack,
            );
            throw new SwapiUnavailableException(
              `Failed to fetch films list: ${error.message}`,
            );
          }),
        ),
      );

      if (!filmsListResponse.data || !filmsListResponse.data.result) {
        throw new SwapiUnavailableException(
          'Invalid response format from SWAPI films list endpoint',
        );
      }

      const resultList = filmsListResponse.data.result;
      const resultArray = Array.isArray(resultList)
        ? resultList
        : (resultList as unknown as { results?: unknown }).results;

      if (Array.isArray(resultArray) && resultArray.length > 0) {
        const first = resultArray[0] as {
          properties?: SwapiFilmPropertiesDto;
          uid?: string | number;
        };
        if (first && typeof first === 'object' && 'properties' in first) {
          return (resultArray as Array<{ properties: SwapiFilmPropertiesDto }>)
            .map((item) => item.properties)
            .filter((properties) => !!properties?.title);
        }
      }

      const refs = (Array.isArray(resultArray) ? resultArray : []) as Array<{
        uid: string | number;
      }>;
      if (refs.length === 0 || refs[0]?.uid === undefined) {
        throw new SwapiUnavailableException(
          'Invalid response format from SWAPI films list endpoint',
        );
      }

      const filmPromises = refs.map((filmRef: { uid: string | number }) =>
        this.getFilmById(filmRef.uid),
      );

      const films = await Promise.all(filmPromises);
      this.logger.log(`Successfully fetched ${films.length} films from SWAPI`);

      return films;
    } catch (error) {
      if (error instanceof SwapiUnavailableException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error fetching films from SWAPI: ${error.message}`,
        error.stack,
      );
      throw new SwapiUnavailableException(`Unexpected error: ${error.message}`);
    }
  }

  async getFilmById(id: string | number): Promise<SwapiFilmPropertiesDto> {
    this.logger.log(`Fetching film with ID: ${id} from SWAPI`);

    try {
      const response = await firstValueFrom<AxiosResponse<SwapiFilmDto>>(
        this.httpService.get<SwapiFilmDto>(`${this.baseUrl}/films/${id}`).pipe(
          timeout(this.requestTimeout),
          catchError((error: AxiosError) => {
            if (error.response?.status === 404) {
              this.logger.warn(`Film with ID ${id} not found in SWAPI`);
              throw new SwapiUnavailableException(
                `Film with ID ${id} not found`,
              );
            }

            this.logger.error(
              `Failed to fetch film ${id} from SWAPI: ${error.message}`,
              error.stack,
            );
            throw new SwapiUnavailableException(
              `Failed to fetch film ${id}: ${error.message}`,
            );
          }),
        ),
      );

      if (
        !response.data ||
        !response.data.result ||
        !response.data.result.properties
      ) {
        throw new SwapiUnavailableException(
          `Invalid response format for film ${id}`,
        );
      }

      this.logger.log(`Successfully fetched film ${id} from SWAPI`);
      return response.data.result.properties;
    } catch (error) {
      if (error instanceof SwapiUnavailableException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error fetching film ${id} from SWAPI: ${error.message}`,
        error.stack,
      );
      throw new SwapiUnavailableException(`Unexpected error: ${error.message}`);
    }
  }
}
