export const ABOUT_HERO = {
  eyebrow: "Technical demo · Amr Hazem",
  title: "AI Document Extraction WorkBench",
  heading: "Built to carry 20 million documents when scaled horizontally.",
  body: "A queue-leveled extraction pipeline: presigned direct-to-S3 uploads, stateless worker fleet, one writer to Postgres, and real-time push back to the clinic. Throughput is a function of worker count, not of application code.",
};

export interface AboutScaleStat {
  value: string;
  label: string;
  note: string;
}

export const ABOUT_SCALE_STATS: readonly AboutScaleStat[] = [
  {
    value: "20M",
    label: "Documents",
    note: "Supported capacity with horizontal scalling.",
  },
  {
    value: "0 dropped",
    label: "Fault resilience",
    note: "Exponential backoff retries and SQS Dead-Letter Queues guarantee zero lost referrals.",
  },
  {
    value: "< 50ms",
    label: "Real-time dispatch",
    note: "Postgres LISTEN/NOTIFY streams extraction events straight to the client with zero polling.",
  },
  {
    value: "20 MB",
    label: "Max per PDF",
    note: "Uploaded direct to S3 — never through the app server.",
  },
  {
    value: "15+",
    label: "Lanes per worker",
    note: "Parallel polling lanes per replica — concurrency before you even add instances.",
  },
  {
    value: "3 days",
    label: "Execution time",
    note: "Design, build and demo delivered end to end in three days.",
  },
];

export interface AboutLifecycleStep {
  step: number;
  title: string;
  body: string;
  tech: string;
}

export const ABOUT_LIFECYCLE: readonly AboutLifecycleStep[] = [
  {
    step: 1,
    title: "Authenticate",
    body: "Stateless JWT carries clinicId; every repository call and cache lookup is scoped to that tenant.",
    tech: "JWT guard",
  },
  {
    step: 2,
    title: "Request upload slot",
    body: "API creates PENDING rows, resolves the extraction schema and issues presigned S3 PUT URLs.",
    tech: "POST /referrals",
  },
  {
    step: 3,
    title: "Direct-to-S3 upload",
    body: "The browser pushes the PDF straight to object storage, keeping app bandwidth flat under load.",
    tech: "Presigned PUT",
  },
  {
    step: 4,
    title: "Queue notification",
    body: "S3 emits ObjectCreated into the upload queue — the buffer that absorbs traffic spikes.",
    tech: "SQS",
  },
  {
    step: 5,
    title: "Worker claim",
    body: "A stateless worker long-polls and claims the job with an atomic Redis lock; duplicates skip safely.",
    tech: "SET NX EX",
  },
  {
    step: 6,
    title: "Validate & extract",
    body: "Magic-byte and size checks, then multimodal extraction into an enforced JSON schema with backoff retries.",
    tech: "Gemini Flash",
  },
  {
    step: 7,
    title: "Publish result",
    body: "Worker publishes COMPLETED / REJECTED / FAILED to the status queue; the API applies it as the single writer.",
    tech: "Status queue",
  },
  {
    step: 8,
    title: "Push to the clinic",
    body: "A Postgres trigger notifies, and the row streams to the open dashboard connection in real time.",
    tech: "LISTEN → SSE",
  },
];

export const ABOUT_CONCURRENCY_CALLOUT = {
  title: "Concurrency model — parallel worker lanes",
  body: "The Agent Worker runs a configurable pool of parallel lanes (default 15), each independently long-polling SQS one message at a time, so many referrals extract concurrently and one slow LLM call never blocks the rest. Lanes are fault-isolated and coordinate safely through the Redis claim lock — scaling out is just running more worker replicas.",
  laneCount: 15,
};

export interface AboutScaleLever {
  key: string;
  detail: string;
}

export const ABOUT_SCALE_LEVERS: readonly AboutScaleLever[] = [
  {
    key: "Parallel worker lanes",
    detail:
      "a configurable pool (default 15) long-polls SQS one message per lane, so a slow LLM call never blocks the rest; lanes are fault-isolated and coordinate via the Redis claim lock.",
  },
  {
    key: "Queue-based load leveling",
    detail:
      "spikes land in SQS, not in the API; consumers drain at their own rate.",
  },
  {
    key: "Stateless workers",
    detail:
      "no DB connections to exhaust, so capacity grows linearly by running more replicas.",
  },
  {
    key: "Bandwidth off the app path",
    detail:
      "presigned S3 uploads keep payload bytes out of the application request path.",
  },
  {
    key: "Cache-aside + O(1) index",
    detail: "Redis serves schema and list reads; Postgres handles writes only.",
  },
  {
    key: "Single-writer aggregates",
    detail: "idempotent DDD transitions make at-least-once delivery safe.",
  },
  {
    key: "Indexed tenant reads",
    detail:
      "clinicId + createdAt index keeps history paging constant-time at volume.",
  },
];

export interface AboutStackGroup {
  category: string;
  items: readonly string[];
}

export const ABOUT_STACK: readonly AboutStackGroup[] = [
  {
    category: "Frontend",
    items: ["Next.js 16", "TypeScript", "Tailwind v4", "react-pdf", "Zustand"],
  },
  {
    category: "API",
    items: ["NestJS", "DDD / Hexagonal", "Prisma", "OpenAPI"],
  },
  {
    category: "Worker",
    items: ["Node.js daemon", "SQS consumer", "Redis locks"],
  },
  {
    category: "Data & infra",
    items: ["PostgreSQL", "Redis", "AWS S3", "SQS", "Docker Compose"],
  },
  {
    category: "AI",
    items: ["Gemini Flash", "Structured JSON schema", "Bounding boxes"],
  },
];

export const ABOUT_BUSINESS_SCOPE =
  "Per-clinic history that reopens into full detail, and JWT tenant isolation across REST, cache and SSE — table stakes, not the interesting part.";
