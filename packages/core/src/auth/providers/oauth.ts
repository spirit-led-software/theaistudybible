import { decodeBase64IgnorePadding } from '@oslojs/encoding';
import { Apple, Google } from 'arctic';
import { Resource } from 'sst';

export const google = new Google(
  Resource.GoogleClientId.value,
  Resource.GoogleClientSecret.value,
  `${Resource.WebAppUrl.value}/sign-in/google/callback`,
);

export const apple = new Apple(
  Resource.AppleClientId.value,
  Resource.AppleTeamId.value,
  Resource.AppleKeyId.value,
  decodeBase64IgnorePadding(
    Resource.AppleAuthKey.value
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replaceAll('\r', '')
      .replaceAll('\n', '')
      .trim(),
  ),
  `${Resource.WebAppUrl.value}/sign-in/apple/callback`,
);
