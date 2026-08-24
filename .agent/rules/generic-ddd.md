---
trigger: always_on
languages_supported:
  - TypeScript
frameworks_supported:
  - NestJS
rule_classification: NestJS & TypeScript DDD Pattern
---

# The Clean DDD Data Update Flow `[NestJS & TypeScript]`

* **Framework & Language:** NestJS, TypeScript
* **Classification:** `[NestJS Architectural Pattern]`

In strict Domain-Driven Design (DDD), the Application Layer (NestJS Command Handlers / Application Services) coordinates the _workflow_, but the Domain Layer dictates the _rules_. To ensure domain invariants are protected, you must never create "shell" or "dummy" aggregates solely to satisfy database updates.

Every data update flow must follow these 4 strict steps:

### Step 1: Fetch the Aggregate Root `[NestJS / TS]`

Always start by retrieving the **full** aggregate root from persistence via a Repository Port interface. The aggregate root represents the transactional consistency boundary and requires its full historical state to protect against invalid mutations.

```typescript
// Application Layer (NestJS Service / Command Handler)
const accountAggregate = await this.accountRepo.findById(accountId);
if (!accountAggregate) {
  throw new AccountNotFoundException(accountId);
}
```

### Step 2: Initialize Entities & Value Objects `[NestJS / TS]`

If the operation involves complex nested data or sub-entities, construct those pure Domain Entities or Value Objects _before_ applying them to the aggregate. These constructors/factory methods handle basic localized validations.

```typescript
// Application Layer (NestJS Service / Command Handler)
const profileEntity = ProfileDetails.create({
  gender: dto.gender,
  birthDate: dto.birthDate,
  contentFormats: dto.contentFormats,
  contentLanguages: dto.contentLanguages,
});
```

### Step 3: Mutate the Aggregate Root `[NestJS / TS]`

Execute the update operation strictly through an explicit behavior method on the Aggregate Root. The aggregate evaluates its _current state_ (fetched in Step 1) alongside the incoming data (from Step 2) to ensure no business rules are violated.

```typescript
// Application Layer (NestJS Service / Command Handler)
// The aggregate root checks invariants (e.g. "Is the account suspended?", "Does the profile match the account type?")
accountAggregate.updateProfile({
  subtitle: dto.subtitle,
  city: dto.city,
  bio: dto.bio,
  minSaleOrder: dto.minSaleOrder,
  profileDetails: profileEntity,
});
```

### Step 4: Save the Aggregate Root `[NestJS / TS]`

Pass the fully mutated aggregate root back to the Repository Port. The Infrastructure Layer (e.g. TypeORM / Prisma / MikroORM repository implementation) is then responsible for determining what specific tables or edges need to be updated to match the final state of the aggregate.

```typescript
// Application Layer (NestJS Service / Command Handler)
await this.accountRepo.save(accountAggregate);
```

---

## Anti-Patterns to Avoid `[NestJS / TS]`

- ❌ **The Anemic Shell:** Do NOT construct objects like `Account.forUpdate(id)` just to pass an ID to an ORM repository method. This bypasses the domain entirely.
- ❌ **Infrastructure-Driven Updates:** Do NOT create specific repository methods tailored for fragments of data (e.g., `this.accountRepo.updateUserBio(id, bio)`). The Application Service shouldn't dictate DB update queries; it should modify the domain aggregate and persist the result.
- ❌ **Leaking Lifecycle Logic:** If you don't load the aggregate, you can't fire necessary domain events (e.g., via NestJS `EventEmitter2` or `@nestjs/cqrs` EventBus) or manage state transitions, like calculating readiness for a `PUBLISHED` status.
