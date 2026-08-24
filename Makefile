# ==============================================================================
# Plena Referral Extraction Platform - Monorepo Makefile
# ==============================================================================
# This Makefile provides organized management targets for developing, building,
# running, containerizing, and stopping all applications in the monorepo:
#   1. web           - Next.js Web Review Interface (apps/web)
#   2. workbench-api - NestJS Workbench API Backend (apps/workbench-api)
#   3. agent_worker  - Node.js + TypeScript SQS Worker (apps/agent_worker)
#   4. postgres/redis- Local data services (Docker Compose)
# ==============================================================================

.PHONY: help install dev dev-web dev-api dev-worker kill stop kill-all build build-web build-api build-worker docker-up docker-dev docker-dev-backend docker-dev-api docker-down docker-logs docker-clean docker-give-perms fix-perms db-reset lint codegen-api clean

# Default target when running 'make'
.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# 1. HELP & DISCOVERY
# ------------------------------------------------------------------------------
help: ## Display available Makefile commands and usage
	@echo ""
	@echo "Plena Referral Extraction Platform - Commands:"
	@echo "--------------------------------------------------------"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?##/ {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""

# ------------------------------------------------------------------------------
# 2. DEPENDENCY INSTALLATION
# ------------------------------------------------------------------------------
install: ## Install all dependencies across all monorepo workspaces
	@echo "--> Installing dependencies for all monorepo apps..."
	npm install

# ------------------------------------------------------------------------------
# 3. DEVELOPMENT RUNNERS (LOCAL MODE)
# ------------------------------------------------------------------------------
dev: ## Run ALL 3 applications concurrently in local development mode
	@echo "--> Starting Web, Workbench API, and Agent Worker simultaneously..."
	npm run dev

dev-web: ## Run ONLY the Next.js Web App in development mode (apps/web)
	@echo "--> Starting Next.js Web App (apps/web)..."
	npm run dev:web

dev-api: ## Run ONLY the NestJS Workbench API in development mode (apps/workbench-api)
	@echo "--> Starting NestJS Workbench API (apps/workbench-api)..."
	npm run dev:api

dev-worker: ## Run ONLY the Node.js Agent Worker in development mode (apps/agent_worker)
	@echo "--> Starting Agent Worker (apps/agent_worker)..."
	npm run dev:worker

# ------------------------------------------------------------------------------
# 4. PROCESS MANAGEMENT & KILL TARGETS
# ------------------------------------------------------------------------------
kill: ## Kill all running local development processes for web, api, and worker apps
	@echo "--> Stopping all local development processes..."
	@-pkill -f "apps/web" 2>/dev/null || true
	@-pkill -f "apps/workbench-api" 2>/dev/null || true
	@-pkill -f "apps/agent_worker" 2>/dev/null || true
	@-pkill -f "concurrently" 2>/dev/null || true
	@-pkill -f "next-server" 2>/dev/null || true
	@-pkill -f "nest start" 2>/dev/null || true
	@-pkill -f "tsx watch" 2>/dev/null || true
	@echo "--> All local development processes stopped."

stop: kill ## Alias for 'make kill'

kill-all: kill ## Alias for 'make kill'

# ------------------------------------------------------------------------------
# 5. DOCKER CONTAINERS & LOCAL STACK
# ------------------------------------------------------------------------------
docker-up: ## Build and start all 5 Docker services (Postgres, Redis, Web, API, Worker) in detached background mode
	@echo "--> Starting Docker Compose stack in detached mode..."
	docker compose up --build -d

docker-dev: ## Build and start all Docker services attached with live output logs
	@echo "--> Starting Docker Compose stack with live output logs..."
	docker compose up --build

docker-dev-backend: ## Build and start NestJS Workbench API container in dev mode with live logs
	@echo "--> Starting NestJS Workbench API container (workbench-api)..."
	docker compose up --build workbench-api




docker-down: ## Gracefully stop and remove Docker Compose containers and networks
	@echo "--> Stopping Docker Compose stack..."
	docker compose down

docker-logs: ## Tail live logs from all running Docker Compose containers
	@echo "--> Tailing live Docker Compose logs (Ctrl+C to exit)..."
	docker compose logs -f

docker-clean: ## Stop Docker containers and purge volumes (wipes Postgres/Redis data) and orphan containers
	@echo "--> Purging Docker Compose containers, networks, and persistent volumes..."
	docker compose down -v --remove-orphans

docker-give-perms: ## Fix ownership permissions on ~/.docker and repository workspace files
	@echo "--> Restoring user file ownership on ~/.docker and workspace..."
	sudo chown -R $$(whoami) ~/.docker .

db-reset: ## Remove DB container, purge data volume, spin up DB container at port 5434, and apply schema
	@echo "--> Resetting database container and purging volume..."
	-docker compose stop postgres 2>/dev/null || true
	-docker compose rm -f -v postgres 2>/dev/null || true
	-docker volume rm -f referral-extraction-platform_postgres_data 2>/dev/null || true
	@echo "--> Starting database container on port 5434..."
	docker compose up -d postgres
	@echo "--> Waiting for Postgres database to become healthy..."
	@until [ "$$(docker inspect --format='{{.State.Health.Status}}' referral-postgres 2>/dev/null)" = "healthy" ]; do sleep 1; done
	@sleep 2
	@echo "--> Applying database schema on port 5434..."
	@docker compose exec -T postgres psql -U referral -d referral_extraction -c '\
		CREATE TABLE IF NOT EXISTS "clinics" (\
			"id" TEXT NOT NULL,\
			"clinic_name" TEXT NOT NULL,\
			"username" TEXT NOT NULL,\
			"password_hash" TEXT NOT NULL,\
			"default_extraction_schema_id" TEXT,\
			"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\
			"updated_at" TIMESTAMP(3) NOT NULL,\
			CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")\
		);\
		CREATE TABLE IF NOT EXISTS "referrals" (\
			"id" TEXT NOT NULL,\
			"patient_name" TEXT NOT NULL,\
			"clinic_id" TEXT NOT NULL,\
			"extraction_schema_id" TEXT,\
			"status" TEXT NOT NULL DEFAULT '\''PENDING'\'',\
			"s3_bucket" TEXT NOT NULL,\
			"s3_object_key" TEXT NOT NULL,\
			"extracted_payload" JSONB,\
			"failed_reason" TEXT,\
			"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\
			"updated_at" TIMESTAMP(3) NOT NULL,\
			CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")\
		);\
		CREATE TABLE IF NOT EXISTS "extraction_schemas" (\
			"id" TEXT NOT NULL,\
			"clinic_id" TEXT NOT NULL,\
			"version" INTEGER NOT NULL DEFAULT 1,\
			"schema_definition" JSONB NOT NULL,\
			"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\
			"updated_at" TIMESTAMP(3) NOT NULL,\
			CONSTRAINT "extraction_schemas_pkey" PRIMARY KEY ("id")\
		);\
		CREATE UNIQUE INDEX IF NOT EXISTS "clinics_username_key" ON "clinics"("username");\
	'
	@echo "--> Database reset complete. Postgres is running on port 5434."



# ------------------------------------------------------------------------------
# 6. PRODUCTION BUILD TARGETS
# ------------------------------------------------------------------------------
build: ## Build all applications across the monorepo
	@echo "--> Building all monorepo applications..."
	npm run build

build-web: ## Build Next.js Web App for production (apps/web)
	@echo "--> Building Next.js Web App..."
	npm run build --workspace apps/web

build-api: ## Build NestJS Workbench API for production (apps/workbench-api)
	@echo "--> Building NestJS Workbench API..."
	npm run build --workspace apps/workbench-api

build-worker: ## Build Agent Worker TypeScript code (apps/agent_worker)
	@echo "--> Building Agent Worker..."
	npm run build --workspace apps/agent_worker

# ------------------------------------------------------------------------------
# 7. QUALITY & MAINTENANCE
# ------------------------------------------------------------------------------
lint: ## Run linting across all monorepo apps
	@echo "--> Linting all monorepo applications..."
	npm run lint

codegen-api: ## Regenerate apps/web's typed API client from the running Workbench API's OpenAPI spec
	@echo "--> Generating apps/web/src/types/api.generated.ts from the Workbench API's /docs-json..."
	npm run codegen:api --workspace apps/web

clean: ## Clean node_modules, .next, and dist build outputs
	@echo "--> Cleaning build artifacts and node_modules..."
	rm -rf node_modules apps/web/.next apps/web/dist apps/workbench-api/dist apps/agent_worker/dist
