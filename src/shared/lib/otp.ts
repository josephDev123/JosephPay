import {
  randomBytes,
  randomInt,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

const OTP_HASH_PREFIX = 'otp-scrypt';
const OTP_KEY_LENGTH = 64;

export const EMAIL_VERIFICATION_OTP_LENGTH = 6;
export const EMAIL_VERIFICATION_OTP_TTL_MINUTES = 10;
export const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5;

export function generateVerificationOtp(
  length = EMAIL_VERIFICATION_OTP_LENGTH,
): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}

export async function hashOtp(otp: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(otp, salt, OTP_KEY_LENGTH)) as Buffer;

  return [OTP_HASH_PREFIX, salt, derivedKey.toString('hex')].join('$');
}

export async function verifyOtp(
  otp: string,
  hashedOtp: string,
): Promise<boolean> {
  const [algorithm, salt, expectedHash] = hashedOtp.split('$');

  if (algorithm !== OTP_HASH_PREFIX || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = (await scrypt(otp, salt, OTP_KEY_LENGTH)) as Buffer;
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, derivedKey);
}
