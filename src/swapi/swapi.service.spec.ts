import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { HttpService } from './http.service';
import { ConfigService } from '@nestjs/config';
import { SwapiService } from './swapi.service';
import { SwapiUnavailableException } from './exceptions/swapi-unavailable.exception';
import {
  SwapiFilmDto,
  SwapiFilmsListDto,
  SwapiFilmPropertiesDto,
} from './dto/swapi-film.dto';

// Mock HttpService to avoid real HTTP calls
const mockHttpService = {
  get: jest.fn(),
};

// Mock ConfigService so the service falls back to the default SWAPI values
const mockConfigService = {
  get: jest.fn((key: string) => {
    const values: Record<string, unknown> = {
      'swapi.baseUrl': 'https://www.swapi.tech/api',
      'swapi.requestTimeout': 10000,
    };

    return values[key];
  }),
};

describe('SwapiService', () => {
  let service: SwapiService;

  const mockFilmProperties: SwapiFilmPropertiesDto = {
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

  const mockFilmsList: SwapiFilmsListDto = {
    message: 'ok',
    total_records: 2,
    total_pages: 1,
    previous: null,
    next: null,
    result: [
      {
        uid: '1',
        description: 'A Film',
        properties: mockFilmProperties,
      },
      {
        uid: '2',
        description: 'A Film',
        properties: {
          ...mockFilmProperties,
          title: 'The Empire Strikes Back',
          episode_id: 5,
          url: 'https://www.swapi.tech/api/films/2/',
        },
      },
    ],
  };

  const mockFilmResponse: SwapiFilmDto = {
    message: 'ok',
    result: {
      properties: {
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
      },
      description: 'A Film',
      _id: '5f63a36eee9fd7000499be42',
      uid: '1',
      __v: 0,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SwapiService>(SwapiService);
    jest.clearAllMocks();
  });

  describe('getAllFilms', () => {
    it('should return all films when SWAPI responds successfully', async () => {
      const mockFilmsListResponse: AxiosResponse<SwapiFilmsListDto> = {
        data: mockFilmsList,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockFilmsListResponse));

      const result = await service.getAllFilms();

      // The list response already embeds `properties`, so the service
      // returns them directly without fetching each film detail.
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        mockFilmsList.result![0].properties,
        mockFilmsList.result![1].properties,
      ]);
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://www.swapi.tech/api/films',
      );
    });

    it('should throw SwapiUnavailableException when films list request fails', async () => {
      const axiosError = {
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError;

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getAllFilms()).rejects.toThrow(
        SwapiUnavailableException,
      );
    });

    it('should throw SwapiUnavailableException when films list response is invalid', async () => {
      const mockInvalidResponse: AxiosResponse<any> = {
        data: { message: 'ok' }, // Missing results
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockInvalidResponse));

      await expect(service.getAllFilms()).rejects.toThrow(
        SwapiUnavailableException,
      );
    });

    it('should fetch film details when list returns refs without properties', async () => {
      const mockFilmsListResponse = {
        data: {
          message: 'ok',
          total_records: 1,
          total_pages: 1,
          previous: null,
          next: null,
          result: [
            {
              uid: '1',
              name: 'A New Hope',
              url: 'https://www.swapi.tech/api/films/1',
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as unknown as AxiosResponse<SwapiFilmsListDto>;

      const mockFilmDetailResponse: AxiosResponse<SwapiFilmDto> = {
        data: mockFilmResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get
        .mockReturnValueOnce(of(mockFilmsListResponse))
        .mockReturnValue(of(mockFilmDetailResponse));

      const result = await service.getAllFilms();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockFilmResponse.result.properties);
    });
  });

  describe('getFilmById', () => {
    it('should return film when SWAPI responds successfully', async () => {
      const mockResponse: AxiosResponse<SwapiFilmDto> = {
        data: mockFilmResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getFilmById('1');

      expect(result).toEqual(mockFilmResponse.result.properties);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://www.swapi.tech/api/films/1',
      );
    });

    it('should throw SwapiUnavailableException when film is not found', async () => {
      const axiosError = {
        message: 'Not Found',
        isAxiosError: true,
        response: { status: 404 },
      } as AxiosError;

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getFilmById('999')).rejects.toThrow(
        SwapiUnavailableException,
      );
    });

    it('should throw SwapiUnavailableException when network error occurs', async () => {
      const axiosError = {
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError;

      mockHttpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.getFilmById('1')).rejects.toThrow(
        SwapiUnavailableException,
      );
    });

    it('should throw SwapiUnavailableException when response format is invalid', async () => {
      const mockInvalidResponse: AxiosResponse<any> = {
        data: { message: 'ok' }, // Missing result
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockInvalidResponse));

      await expect(service.getFilmById('1')).rejects.toThrow(
        SwapiUnavailableException,
      );
    });

    it('should handle both string and number IDs', async () => {
      const mockResponse: AxiosResponse<SwapiFilmDto> = {
        data: mockFilmResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getFilmById(1);
      await service.getFilmById('1');

      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://www.swapi.tech/api/films/1',
      );
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://www.swapi.tech/api/films/1',
      );
    });
  });
});
