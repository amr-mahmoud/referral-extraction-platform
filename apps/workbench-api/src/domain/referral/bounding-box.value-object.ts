import { DomainError } from '../shared/domain.error';

export class InvalidBoundingBoxError extends DomainError {
  public readonly code = 'INVALID_BOUNDING_BOX';

  constructor(message: string) {
    super(message);
  }
}

export class BoundingBox {
  public constructor(
    public readonly xmin: number,
    public readonly ymin: number,
    public readonly xmax: number,
    public readonly ymax: number,
  ) {
    if (
      ![xmin, ymin, xmax, ymax].every((coordinate) =>
        Number.isFinite(coordinate),
      )
    ) {
      throw new InvalidBoundingBoxError(
        'Bounding box coordinates must be finite numbers',
      );
    }
    if (xmin > xmax || ymin > ymax) {
      throw new InvalidBoundingBoxError(
        'Bounding box min coordinates must not exceed max coordinates',
      );
    }
  }

  public equals(other: BoundingBox): boolean {
    return (
      this.xmin === other.xmin &&
      this.ymin === other.ymin &&
      this.xmax === other.xmax &&
      this.ymax === other.ymax
    );
  }
}
