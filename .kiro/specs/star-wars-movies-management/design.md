# Design Document

## Overview

The Star Wars Movies Management System is a NestJS-based backend application that provides comprehensive movie management capabilities by integrating with the external Star Wars API (SWAPI). The system implements role-based access control with two user types: Regular Users who can view movies, and Administrators who have full CRUD capabilities and can synchronize data with the external API.

The application follows Hexagonal Architecture principles, maintaining clear separation between business logic and infrastructure concerns. This design ensures maintainability, testability, and flexibility for future enhancements.

## Architecture

### High-Level Architecture

The system follows the existing boilerplate's Hexagonal Architecture pattern with these core layers:

1. **Domain Layer**: Contains business entities and core business logic
2. **Application Layer**: Contains services, controllers, and use cases
3. **Infrastructure Layer**: Contains database adapters, external API clients, and persistence implementations
4. **Presentation Layer**: REST API controllers with Swagger documentation

### Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM (following existing boilerplate pattern)
- **Authentication**: JWT tokens with refresh token mechanism
- **Authorization**: Role-based access control (RBAC)
- **Documentation**: Swagger/OpenAPI
- **External API**: SWAPI (Star Wars API) integration
- **Testing**: Jest for unit and integration tests

### External API Integration

The system integrates with the Star Wars API (https://www.swapi.tech/) to synchronize movie data. Based on SWAPI documentation, the films endpoint returns data in this structure:

```json
{
  "result": {
    "properties": {
      "title": "A New Hope",
      "episode_id": 4,
      "opening_crawl": "It is a period of civil war...",
      "director": "George Lucas",
      "producer": "Gary Kurtz, Rick McCallum",
      "release_date": "1977-05-25",
      "characters": ["https://www.swapi.tech/api/people/1/"],
      "planets": ["https://www.swapi.tech/api/planets/1/"],
      "starships": ["https://www.swapi.tech/api/starships/2/"],
      "vehicles": ["https://www.swapi.tech/api/vehicles/4/"],
      "species": ["https://www.swapi.tech/api/species/1/"],
      "created": "2014-12-10T14:23:31.880000Z",
      "edited": "2014-12-20T19:49:45.256000Z",
      "url": "https://www.swapi.tech/api/films/1/"
    },
    "description": "A Film"
  }
}
```

## Components and Interfaces

### Movie Module Components

#### Domain Entity
```typescript
// src/movies/domain/movie.ts
export class Movie {
  id: number | string;
  title: string;
  episodeId: number;
  openingCrawl: string;
  director: string;
  producer: string;
  releaseDate: Date;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  swapiUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Repository Port
```typescript
// src/movies/infrastructure/persistence/movie.repository.ts
export abstract class MovieRepository {
  abstract create(data: Movie): Promise<Movie>;
  abstract findAll(options?: FindAllMoviesOptions): Promise<PaginatedMovies>;
  abstract findById(id: Movie['id']): Promise<Movie | null>;
  abstract update(id: Movie['id'], payload: Partial<Movie>): Promise<Movie | null>;
  abstract remove(id: Movie['id']): Promise<void>;
  abstract findBySwapiUrl(url: string): Promise<Movie | null>;
  abstract findByTitle(title: string): Promise<Movie | null>;
}
```

#### Service Layer
```typescript
// src/movies/movies.service.ts
export class MoviesService {
  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly swapiService: SwapiService,
  ) {}

  async findAll(options: FindAllMoviesDto): Promise<PaginatedMovies>;
  async findById(id: Movie['id']): Promise<Movie>;
  async create(createMovieDto: CreateMovieDto): Promise<Movie>;
  async update(id: Movie['id'], updateMovieDto: UpdateMovieDto): Promise<Movie>;
  async remove(id: Movie['id']): Promise<void>;
  async syncWithSwapi(): Promise<SyncResult>;
}
```

### SWAPI Integration Module

#### SWAPI Service
```typescript
// src/swapi/swapi.service.ts
export class SwapiService {
  constructor(private readonly httpService: HttpService) {}

  async getAllFilms(): Promise<SwapiFilm[]>;
  async getFilmById(id: number): Promise<SwapiFilm>;
}
```

#### SWAPI DTOs
```typescript
// src/swapi/dto/swapi-film.dto.ts
export class SwapiFilmDto {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  characters: string[];
  planets: string[];
  starships: string[];
  vehicles: string[];
  species: string[];
  url: string;
  created: string;
  edited: string;
}
```

### Authentication Enhancement

The existing authentication system will be leveraged with role-based access control:

- **Regular Users (RoleEnum.user)**: Can view movies list and individual movie details
- **Administrators (RoleEnum.admin)**: Full CRUD operations plus synchronization capabilities

### Controllers

#### Movies Controller
```typescript
// src/movies/movies.controller.ts
@Controller('movies')
@ApiTags('Movies')
@UseGuards(AuthGuard('jwt'))
export class MoviesController {
  @Get()
  @ApiOperation({ summary: 'Get all movies' })
  async findAll(@Query() query: FindAllMoviesDto): Promise<PaginatedMovies>;

  @Get(':id')
  @ApiOperation({ summary: 'Get movie by ID' })
  async findOne(@Param('id') id: string): Promise<Movie>;

  @Post()
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create new movie (Admin only)' })
  async create(@Body() createMovieDto: CreateMovieDto): Promise<Movie>;

  @Patch(':id')
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update movie (Admin only)' })
  async update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto): Promise<Movie>;

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete movie (Admin only)' })
  async remove(@Param('id') id: string): Promise<void>;

  @Post('sync')
  @Roles(RoleEnum.admin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Sync movies with SWAPI (Admin only)' })
  async syncWithSwapi(): Promise<SyncResultDto>;
}
```

## Data Models

### Movie Entity (Relational)
```typescript
// src/movies/infrastructure/persistence/relational/entities/movie.entity.ts
@Entity({ name: 'movie' })
export class MovieEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ name: 'episode_id', type: 'int' })
  episodeId: number;

  @Column({ name: 'opening_crawl', type: 'text' })
  openingCrawl: string;

  @Column({ type: 'varchar', length: 255 })
  director: string;

  @Column({ type: 'varchar', length: 500 })
  producer: string;

  @Column({ name: 'release_date', type: 'date' })
  releaseDate: Date;

  @Column({ type: 'json' })
  characters: string[];

  @Column({ type: 'json' })
  planets: string[];

  @Column({ type: 'json' })
  starships: string[];

  @Column({ type: 'json' })
  vehicles: string[];

  @Column({ type: 'json' })
  species: string[];

  @Column({ name: 'swapi_url', type: 'varchar', length: 500, nullable: true })
  swapiUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### DTOs

#### Create Movie DTO
```typescript
// src/movies/dto/create-movie.dto.ts
export class CreateMovieDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'A New Hope' })
  title: string;

  @IsNumber()
  @IsPositive()
  @ApiProperty({ example: 4 })
  episodeId: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'It is a period of civil war...' })
  openingCrawl: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'George Lucas' })
  director: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Gary Kurtz, Rick McCallum' })
  producer: string;

  @IsDateString()
  @ApiProperty({ example: '1977-05-25' })
  releaseDate: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['https://www.swapi.tech/api/people/1/'] })
  characters: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['https://www.swapi.tech/api/planets/1/'] })
  planets: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['https://www.swapi.tech/api/starships/2/'] })
  starships: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['https://www.swapi.tech/api/vehicles/4/'] })
  vehicles: string[];

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ example: ['https://www.swapi.tech/api/species/1/'] })
  species: string[];
}
```

## Error Handling

### Custom Exceptions
```typescript
// src/movies/exceptions/movie-not-found.exception.ts
export class MovieNotFoundException extends NotFoundException {
  constructor(id: string | number) {
    super({
      status: HttpStatus.NOT_FOUND,
      error: 'movieNotFound',
      message: `Movie with ID ${id} not found`,
    });
  }
}

// src/swapi/exceptions/swapi-unavailable.exception.ts
export class SwapiUnavailableException extends ServiceUnavailableException {
  constructor(message?: string) {
    super({
      status: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'swapiUnavailable',
      message: message || 'Star Wars API is currently unavailable',
    });
  }
}
```

### Global Error Filter
The existing global exception filter will handle movie-specific exceptions with appropriate HTTP status codes and error messages.

## Testing Strategy

### Unit Testing
- **Service Layer Tests**: Test business logic in MoviesService and SwapiService
- **Repository Tests**: Test data access patterns with mocked database
- **Controller Tests**: Test request/response handling and authorization
- **Authentication Tests**: Verify role-based access control

### Integration Testing
- **API Endpoint Tests**: Full request/response cycle testing
- **Database Integration**: Test actual database operations
- **External API Integration**: Mock SWAPI responses for reliable testing
- **Authorization Flow**: End-to-end authentication and authorization tests

### Testing Structure
```
test/
├── unit/
│   ├── movies/
│   │   ├── movies.service.spec.ts
│   │   ├── movies.controller.spec.ts
│   │   └── movies.repository.spec.ts
│   ├── swapi/
│   │   └── swapi.service.spec.ts
│   └── auth/
│       └── role-based-access.spec.ts
├── integration/
│   ├── movies/
│   │   ├── movies-api.e2e-spec.ts
│   │   └── movies-sync.e2e-spec.ts
│   └── auth/
│       └── auth-flow.e2e-spec.ts
└── fixtures/
    ├── movies/
    │   └── sample-movies.ts
    └── swapi/
        └── swapi-responses.ts
```

### Test Coverage Goals
- **Services**: 90%+ coverage
- **Controllers**: 85%+ coverage  
- **Critical Paths**: 100% coverage (authentication, authorization, data sync)

## Security Considerations

### Role-Based Access Control
- Movies list and details: Accessible to authenticated Regular Users and Administrators
- Movie CRUD operations: Restricted to Administrators only
- SWAPI synchronization: Restricted to Administrators only

### Data Validation
- Input validation using class-validator decorators
- SQL injection prevention through TypeORM parameterized queries
- XSS protection through proper response serialization

### Rate Limiting
- Implement rate limiting for SWAPI synchronization to prevent abuse
- Consider implementing general API rate limiting for production deployment

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields (title, episode_id)
- Pagination for large result sets
- Database connection pooling (inherited from boilerplate)

### External API Optimization
- Implement caching for SWAPI responses during synchronization
- Batch processing for multiple API calls
- Graceful degradation when SWAPI is unavailable

### Response Optimization
- Implement response compression
- Use appropriate HTTP caching headers
- Optimize JSON serialization