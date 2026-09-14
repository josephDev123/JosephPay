import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { errorResponse } from '../../shared/http/api-response.js';
import { mapProfile, type ProfileView } from './mappers/profile.mapper.js';
import { ProfileRepository } from './profile.repository.js';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(userId: string | undefined): Promise<ProfileView> {
    if (!userId) {
      throw new UnauthorizedException(
        errorResponse('User authentication is required', 'UNAUTHORIZED'),
      );
    }

    const profile = await this.profileRepository.getProfile(userId);

    if (!profile) {
      throw new NotFoundException(
        errorResponse('Profile not found', 'PROFILE_NOT_FOUND', [
          'No profile exists for the authenticated user',
        ]),
      );
    }

    return mapProfile(profile) as ProfileView;
  }
}
