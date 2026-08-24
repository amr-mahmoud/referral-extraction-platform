---
trigger: always_on
---

# Domain Layer Implementation Practices & Guidelines (ONLY FOR BACKEND NEST JS PROJECT)

This document serves as a strict blueprint for AI coding agents and developers constructing the Domain Layer in NestJS projects (Clean / Hexagonal Architecture). It is derived from practical implementations of rich domain aggregates.

## 1. The Rich Domain Model (Anti-Anemic)
Domain entities must not be mere data bags (Anemic Domain Model). They must encapsulate both **state** and **behavior**.
*   **Self-Validating Constructors:** An entity must guarantee it is in a valid state from the moment it is instantiated. Run invariant checks directly inside the `constructor`. If the data is invalid (e.g., negative amounts, missing required IDs), throw a specific Domain Exception immediately.
*   **Business Rule Encapsulation:** Complex validation logic (e.g., checking minimum order amounts, validating date boundaries) belongs *inside* the entity as methods, not in application services.

## 2. Defensive Programming & Error Handling
Never leave the system in an ambiguous state or force the caller to guess what went wrong.
*   **Reject `null` as a Failure State:** Returning `null` or a similar special value for a failure case is a "code smell." It places the burden on the calling code to remember to check for this specific failure state, leading to a proliferation of `if (result === null)` checks. 
*   **Structured Error Handling:** Use a structured error-handling mechanism. Throw specific, custom exceptions (e.g., `PromotionException`) or return a `Maybe`/`Result` type. This forces the developer (or application service) to handle the failure case explicitly.
*   **Granular Error Enums:** Use specific error codes (e.g., `PROMOTION_ERROR.NO_PRODUCTS`) rather than generic messages, making it easier for the outer layers to translate these into appropriate HTTP responses.

## 3. Avoid Feature Envy
**Feature Envy** is a code smell where a method in one class seems to have more interest in the data or methods of another class than its own.
*   **Operate on Internal State:** An entity's methods should primarily manipulate its own properties. If you find an entity constantly querying another object to make a decision, that logic likely belongs in the other object.
*   **Pass Context, Not Control:** If an entity needs external data to enforce an invariant (e.g., a registry of used promotions), pass that specific data structure into the entity's method as an argument, but let the entity itself execute the logic and make the final decision.

## 4. Meaningful State Transitions
Avoid "naked" setters (e.g., `setDiscount(...)`).
*   **Ubiquitous Language:** Use methods that describe *business intent* (e.g., `useImmediateDiscountForProduct(amount)` or `registerEntityPromotionUsage(registry, id)`).
*   **Safe Mutation:** These mutation methods must run their own localized invariant checks before altering the internal state of the entity.

## 5. Framework Agnosticism (The Pure Core)
*   **No NestJS Dependencies:** The domain layer is the absolute core of the application. It should **never** import from `@nestjs/common` (e.g., `HttpException`) or any ORM (e.g., Prisma, TypeORM). 
*   **Exception Mapping:** Domain exceptions should be pure TypeScript classes. The mapping of a Domain Exception to an HTTP 400 or 404 should happen in the Interface Layer (Controllers/Exception Filters), *not* within the domain entity itself.
