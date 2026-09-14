export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface ProfileRecord {
  id: string;
  userId: string;
  phoneNumber: string | null;
  phoneVerifiedAt: Date | null;
  dateOfBirth: Date | null;
  gender: Gender | null;
  avatarUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileView {
  id: string;
  userId: string;
  phoneNumber: string | null;
  phoneVerifiedAt: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  avatarUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapProfile(profile: ProfileRecord | null): ProfileView | null {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    phoneNumber: profile.phoneNumber,
    phoneVerifiedAt: profile.phoneVerifiedAt
      ? profile.phoneVerifiedAt.toISOString()
      : null,
    dateOfBirth: profile.dateOfBirth
      ? profile.dateOfBirth.toISOString().slice(0, 10)
      : null,
    gender: profile.gender,
    avatarUrl: profile.avatarUrl,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    postalCode: profile.postalCode,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
