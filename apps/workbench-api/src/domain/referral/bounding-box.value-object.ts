import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';

export class InvalidBoundingBoxError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_BOUNDING_BOX;

  constructor(message: string) {
    super(DOMAIN_ERROR.REFERRAL_INVALID_BOUNDING_BOX, message);
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
