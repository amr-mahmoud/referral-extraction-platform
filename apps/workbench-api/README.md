# WorkBench API

> Lives at `workbench-api/` in the monorepo, alongside `worker-agent/` and `client/`.

## What this is

The WorkBench API is the NestJS service that owns everything client-facing: clinic auth,
extraction schema management, referral creation, review reads, and pushing live status
updates over SSE. It never touches the AI extraction itself and never handles a PDF's bytes
directly — those are deliberately someone else's job.

## Responsibilities

- Clinic signup / login, JWT issuance
- Scoping every query to the authenticated clinic (multi-tenancy)
- Creating extraction schemas — via web form (field name + description) or JSON upload
- Creating a referral row and issuing a presigned S3 PUT URL for the upload
- Serving referral lists and detail views (extracted payload + a presigned GET URL for the PDF)
- Streaming status changes to the client over SSE

## What it explicitly does *not* do

- **Doesn't receive the PDF bytes.** The client uploads straight to S3 with the presigned
  URL this service issues. Proxying 20MB files through the API at the assignment's target
  throughput would make this the bottleneck instead of just the orchestration layer.
- **Doesn't call Gemini.** Extraction is `worker-agent`'s job — this service only ever reads
  the results the worker writes.
- **Doesn't consume SQS.** The queue exists between S3 and the worker; this service has no
  reason to know it's there.

## API surface

| Method & path | Purpose |
|---|---|
| `POST /auth/signup` | `{ clinic_name, username, password }` → creates clinic |
| `POST /auth/login` | `{ username, password }` → JWT (httpOnly cookie) |
| `POST /extraction-schemas` | Create/update a schema — field list or uploaded JSON |
| `GET /extraction-schemas` | List the authenticated clinic's schemas |
| `POST /referrals` | Create referral row, resolve schema, return `{ referral_id, presigned_url }` |
| `GET /referrals` | Paginated list, scoped to `clinic_id` |
| `GET /referrals/:id` | Detail: status, `extracted_payload`, presigned GET URL for the PDF |
| `GET /referrals/:id/stream` | SSE — pushes status transitions as they happen |
| `PATCH /referrals/:id` | Save a reviewer correction to a field (see assumptions) |

## Auth & multi-tenancy

JWT in an httpOnly cookie rather than a server-side session store — the assignment's "Session
Management System" line is satisfied either way, and stateless JWT is the faster build for a
2-day window. A single NestJS guard extracts `clinic_id` from the token and injects it into
every repository call, so "a clinic only sees its own referrals" is enforced in one place
rather than repeated per-controller and easy to forget on a new endpoint.

## Presigned upload flow

`POST /referrals` resolves the extraction schema to use (referral-specific override → clinic's
`default_extraction_schema_id` → null for LLM-default mode), writes a `Referral` row with
`status = AWAITING_UPLOAD` and that resolved schema id, and returns a presigned S3 `PUT` URL
scoped to `referrals/{clinic_id}/{referral_id}.pdf` with `Content-Length` capped at 20MB and
`Content-Type` restricted to `application/pdf` baked into the presign policy — so size and
type are enforced before any byte reaches S3, not after.

## Real-time status (SSE)

A Postgres trigger fires `NOTIFY` on `referrals.status` changes — regardless of what changed
the row, so this works whether it was `worker-agent` or a manual admin action. This service
`LISTEN`s on that channel and, for any client holding an open `/referrals/:id/stream`
connection, forwards the matching event. Chosen over WebSockets because the traffic here is
one-directional and infrequent (a handful of transitions per referral) — see the earlier
discussion in this thread for the full tradeoff, including where it stops being the right
call at very large concurrent-connection counts.

## Environment variables

| Variable | Purpose |
|---|---|
| `AWS_REGION` | Region for the S3 client (presign only — no SQS access needed here) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Scoped IAM credentials (S3 put/get presign only) |
| `S3_BUCKET` | Bucket referenced when generating presigned URLs |
| `DATABASE_URL` | Postgres connection string (same schema as `worker-agent`) |
| `JWT_SECRET` | Signing secret for auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1h`) |

## Project structure

```
workbench-api/
  src/
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

    application/
      ports/
        clinic-repository.port.ts
        referral-repository.port.ts
        extraction-schema-repository.port.ts
        storage.port.ts              # presign/get, S3-agnostic
        password-hasher.port.ts
        token.port.ts                # sign/verify, JWT-agnostic
      clinic/
        clinic.service.ts            # signup, login use cases
      referral/
        referral.service.ts          # create, list, get, resolve-schema use cases
      extraction-schema/
        extraction-schema.service.ts # create from web form or JSON upload
      application.module.ts

    infrastructure/
      persistence/
        prisma.service.ts
        clinic.repository.ts          # implements ClinicRepositoryPort
        referral.repository.ts        # implements ReferralRepositoryPort
        extraction-schema.repository.ts
      storage/
        s3-storage.service.ts         # implements StoragePort
      auth/
        bcrypt-password-hasher.service.ts  # implements PasswordHasherPort
        jwt-token.service.ts               # implements TokenPort
      notifications/
        postgres-listen.service.ts    # LISTEN, no port — see note below
      infrastructure.module.ts

    interface/
      http/
        auth/
          auth.controller.ts
          dto/
        clinics/
          clinics.controller.ts
        extraction-schemas/
          extraction-schemas.controller.ts
          dto/
        referrals/
          referrals.controller.ts     # includes the @Sse() status stream
          dto/
        guards/
          jwt-auth.guard.ts
      interface.module.ts

    main.ts
  package.json
  tsconfig.json
  Dockerfile
  .env.example
```

`prisma/` points at the same root `prisma/schema.prisma` used by `worker-agent` — one schema,
shared by both services, no duplicated model definitions.

reference @docs/domain-layer.md for domain layer structure.

## Running locally

```bash
cd workbench-api
cp .env.example .env   # fill in AWS creds, bucket, DB URL, JWT secret
npm install
npm run start:dev
```

Requires the S3 bucket to exist (`infra/setup-aws.sh` at the repo root) and Postgres reachable
at `DATABASE_URL` (`docker-compose.yml` starts it for local dev). Doesn't require the SQS
queue or `worker-agent` to be running to boot — referrals will simply sit in `AWAITING_UPLOAD`
until the pipeline downstream is up.

## Assumptions & limitations

- SSE fan-out via in-process `LISTEN` works for a single API instance. Running multiple
  replicas behind a load balancer would need Redis pub/sub in front of it so a status change
  reaches whichever instance is holding the relevant client's connection — not needed for the
  demo, worth flagging as the scaling seam.
- `PATCH /referrals/:id` overwrites `extracted_payload` in place; the original AI output is
  not retained separately after a correction. If an audit trail of AI-output-vs-human-edit
  is wanted, that's a schema change (separate `reviewed_payload` column), not an API change.
- No row-level security at the Postgres level — multi-tenancy is enforced entirely in the
  application layer (the guard). Acceptable for this build; a production version handling
  real PHI would likely add RLS as defense in depth rather than relying on app code alone.
- No request throttling implemented at the API layer for this demo; would add rate limiting
  ahead of the presign endpoint specifically before this saw real traffic.