export interface S3ObjectCreatedEvent {
  Records: S3ObjectCreatedRecord[];
}

export interface S3ObjectCreatedRecord {
  eventName: string;
  s3: {
    bucket: { name: string };
    object: { key: string };
  };
}

export const REFERRAL_OBJECT_KEY_PATTERN = /^referrals\/([^/]+)\/([^.]+)\.pdf$/;

export function parseReferralObjectKey(
  key: string,
): { clinicId: string; referralId: string } | null {
  const match = REFERRAL_OBJECT_KEY_PATTERN.exec(key);
  if (!match) {
    return null;
  }
  return { clinicId: match[1], referralId: match[2] };
}
