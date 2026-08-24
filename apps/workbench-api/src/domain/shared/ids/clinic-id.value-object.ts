import { DomainError } from '../domain.error';

export class InvalidClinicIdError extends DomainError {
  public readonly code = 'INVALID_CLINIC_ID';

  constructor(id: unknown) {
    super(`Invalid clinic id: '${String(id)}'`);
  }
}

export class ClinicId {
  private constructor(public readonly value: string) {}

  public static from(value: string): ClinicId {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new InvalidClinicIdError(value);
    }
    return new ClinicId(value);
  }

  public equals(other: ClinicId): boolean {
    return this.value === other.value;
  }
}
