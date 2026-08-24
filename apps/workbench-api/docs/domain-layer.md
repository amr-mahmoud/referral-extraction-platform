# Domain Layer

Three aggregate roots: `Clinic`, `Referral`, `ExtractionSchema`. Each owns its own
consistency boundary — no transaction spans two roots, and cross-aggregate links are
always by id, never by embedding.

---

## Clinic (Aggregate Root)

| Property | Type |
|---|---|
| `id` | `ClinicId` |
| `clinicName` | `string` |
| `username` | `string` (unique) |
| `passwordHash` | `PasswordHash` (VO) |
| `defaultExtractionSchemaId` | `ExtractionSchemaId \| null` — reference only |
| `createdAt` / `updatedAt` | `Date` |

**Reason:** consistency boundary for **identity and credentials** only. Deliberately
small — a small aggregate is a healthy aggregate. Referenced everywhere else by
**id**, never embedded, so writing a referral never touches a clinic row.

### Value Objects
| VO | Purpose |
|---|---|
| `PasswordHash` | Wraps a hashed credential so a plaintext string can never be assigned to this field — **illegal states unrepresentable**. |

---

## Referral (Aggregate Root)

| Property | Type |
|---|---|
| `id` | `ReferralId` |
| `patientName` | `string` |
| `clinicId` | `ClinicId` — reference only |
| `extractionSchemaId` | `ExtractionSchemaId \| null` — **resolved and fixed** once processing starts |
| `status` | `ReferralStatus` (VO) |
| `s3Object` | `S3Object` (VO) |
| `extractedPayload` | `ExtractedField[]` (VO collection) |
| `errorMessage` | `string \| null` |
| `createdAt` / `updatedAt` | `Date` |

**Reason:** owns the **transactional invariant** of the extraction state machine — an
invalid jump (`AWAITING_UPLOAD → COMPLETED`) must be structurally rejected inside a
single transaction, not merely discouraged by convention. The highest-**throughput**
aggregate in the system, so its independence from `Clinic`/`ExtractionSchema` writes
is what keeps referral ingestion from contending with unrelated operations.

### Value Objects
| VO | Purpose |
|---|---|
| `ReferralStatus` | Encapsulates allowed transitions — an invalid state change is a caught violation, not a string typo. |
| `ExtractedField` | `{ value, pageNumber, boundingBox }`. **No identity of its own** — never addressed independently of the referral, always persisted as part of its parent's transaction. |
| `BoundingBox` | `{ xmin, ymin, xmax, ymax }`, nested in `ExtractedField`. Nullable **as a unit**, matching the graceful-degradation design for ungrounded fields. |
| `S3Object` | `{ bucket, key }`. Groups two primitives that only ever change together — avoids **primitive obsession**. |

---

## ExtractionSchema (Aggregate Root)

| Property | Type |
|---|---|
| `id` | `ExtractionSchemaId` |
| `clinicId` | `ClinicId` — reference only |
| `version` | `number` |
| `schemaDefinition` | `FieldDefinition[]` (VO collection) |
| `createdAt` | `Date` |

**Reason:** independent lifecycle from `Clinic` because a published version must stay
**immutable** forever — past referrals depend on it for reproducibility. Nesting it
inside `Clinic` would make that immutability unenforceable and create write
**contention** between profile edits and schema publishing, which have no business
blocking each other.

### Value Objects
| VO | Purpose |
|---|---|
| `FieldDefinition` | `{ key, label, type, description }`. **Structural equality**, not identity — exists only as part of one schema version's definition. |

---

## Boundary rules applied

- **One repository per aggregate root, only:** `ClinicRepositoryPort`,
  `ReferralRepositoryPort`, `ExtractionSchemaRepositoryPort`. No repository for a VO
  or an entity nested inside a root.
- **Cross-aggregate references are ids, never embedded objects** — `clinicId`,
  `extractionSchemaId`.
- **No transaction spans two aggregate roots.** A future cross-aggregate concern
  (e.g. `Clinic.referralCount`) goes through eventual consistency — a domain event —
  not a shared transaction.

---

## Resulting folder structure

```
domain/
  clinic/
    clinic.aggregate.ts
    password-hash.value-object.ts

  referral/
    referral.aggregate.ts
    referral-status.value-object.ts
    extracted-field.value-object.ts
    bounding-box.value-object.ts
    s3-object.value-object.ts

  extraction-schema/
    extraction-schema.aggregate.ts
    field-definition.value-object.ts
```

Every entity and value object stays inside the folder of the aggregate that owns
it — nothing in `referral/` is ever imported by `extraction-schema/` or `clinic/`,
and vice versa. If two aggregates ever need to share a shape (unlikely here, since
`FieldDefinition` and `ExtractedField` are structurally similar but semantically
different — one is a schema, the other is a result), that's a signal for a shared
kernel, not a reason to import across aggregate folders.