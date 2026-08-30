/**
 * Application-defined contract for the service that consumes the worker's
 * status-update queue. The infrastructure SQS adapter implements it; no
 * caller ever depends on the SQS transport directly. The port is deliberately
 * transport-agnostic — only the lifecycle is exposed because all business
 * handling is delegated to the `ApplicationService` by the implementing
 * adapter.
 */
export const QUEUE_SERVICE_PORT = 'QUEUE_SERVICE_PORT';

export interface QueueServicePort {
  startConsuming(): void;
  shutdown(): Promise<void>;
}
