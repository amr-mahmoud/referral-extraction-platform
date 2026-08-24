export class NotImplementedError extends Error {
  public constructor(operation = 'operation') {
    super(`Not implemented: ${operation}`);
    this.name = 'NotImplementedError';
  }
}
