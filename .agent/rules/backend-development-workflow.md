# Development Workflow (Strict Order of Operations) (Backend only)

* **Framework / Language:** NestJS (TypeScript)
* **Architecture:** Clean / Hexagonal Architecture (Domain-Driven Design)
* **Classification:** `[NestJS REST API Order of Operations]`

---

### 1. Step 1: The Core (Domain Layer)
* Define `src/domain/{aggregate}/entities/{entity}.entity.ts` (Pure TypeScript domain entity / aggregate root; zero framework/ORM dependencies, encapsulation of business invariants).
* Define `src/domain/{aggregate}/ports/{entity}.repository.port.ts` (Repository interface / outbound port contract).
* *(Optional)* Define domain value objects and domain events in `src/domain/{aggregate}/value-objects/` and `src/domain/{aggregate}/events/`.

---

### 2. Step 2: The Logic (Application Layer)
* Define `src/application/{feature}/dtos/{use-case}.dto.ts` (or `types.ts` / Command / Query input and response interfaces).
* Implement `src/application/{feature}/use-cases/{use-case}.service.ts` (Pure application service executing business logic, orchestrating domain entities, and invoking repository ports).

---

### 3. Step 3: The Persistence (Infrastructure Layer)
* Update database models in `prisma/schema.prisma` (and run migrations).
* Implement `src/infrastructure/persistence/prisma/mappers/{entity}.mapper.ts` (**Crucial:** Bidirectional mapper between Prisma ORM models and pure Domain entities).
* Implement `src/infrastructure/persistence/prisma/repositories/{entity}.repository.ts` (Concrete persistence adapter implementing the domain repository port via `PrismaService`).

---

### 4. Step 4: The Contract (Interface Layer - REST API)
* Define `src/interfaces/http/dtos/{endpoint}.request.dto.ts` & `response.dto.ts` (Data Transfer Objects decorated with `class-validator`, `class-transformer`, and `@nestjs/swagger` OpenAPI annotations).
* Implement `src/interfaces/http/controllers/{feature}.controller.ts` (NestJS `@Controller` mapping HTTP routes, guards, status codes, and delegating requests to Application Use Cases / Services).

---

### 5. Step 5: Wiring (Dependency Injection & Modules)
* Update / Define `src/modules/{feature}.module.ts` (or `src/infrastructure/{feature}.module.ts`).
* Register providers and bind the concrete repository implementation to the repository interface symbol/token:
  ```typescript
  providers: [
    {
      provide: '{ENTITY}_REPOSITORY_PORT',
      useClass: Prisma{Entity}Repository,
    },
    {Feature}UseCaseService,
  ],
  controllers: [{Feature}Controller],
  exports: ['{ENTITY}_REPOSITORY_PORT', {Feature}UseCaseService],
  ```
* Wire the feature module into `src/app.module.ts`.