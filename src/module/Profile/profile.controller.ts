import { Controller, Get, Req } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import type { Request } from 'express';
import { successResponse } from '../../shared/http/api-response.js';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProfileResponseDto } from '../../docs/swagger.models.js';

@ApiTags('Profiles')
@Controller('api/v1/users/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Fetch the authenticated user profile' })
  @ApiOkResponse({
    type: ProfileResponseDto,
  })
  async getProfile(@Req() req: Request) {
    const userId = req.user?.sub;
    const profile = await this.profileService.getProfile(userId);

    return successResponse('User profile fetched successfully', profile);
  }
}
