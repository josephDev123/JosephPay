import { Injectable } from '@nestjs/common';
import { KycIdentityType, KycProvider } from './kycs-provider-interface.js';
import { SubmitKycDto } from '../dto/submit-kyc.dto.js';
import { Dojah } from 'dojah-typescript-sdk';

@Injectable()
export class DojahAdapter implements KycProvider {
  async verifyKYCIdentity(
    data: Omit<SubmitKycDto, 'documentType'>,
  ): Promise<KycIdentityType> {
    const dojah = new Dojah({
      authorization: process.env.DOJAH_SECRET_KEY,
      appId: process.env.DOJAH_APP_ID,
    });

    const result = await dojah.nigeriaKyc.getPremiumBvn({ bvn: 22222222222 });

    const dojahResult: KycIdentityType = {
      firstName: result.data.entity?.first_name || '',
      lastName: result.data.entity?.last_name || '',
      middleName: result.data.entity?.middle_name || '',
      dateOfBirth: result.data.entity?.date_of_birth
        ? new Date(result.data.entity.date_of_birth)
        : null,
      nationality: result.data.entity?.nationality || '',
      documentNumber: result.data.entity?.bvn || '',
      documentIssueDate: result.data.entity?.registration_date
        ? new Date(result.data.entity?.registration_date)
        : null,
      documentExpiryDate: null,
      providerReference: null,
      providerResponse: result?.data?.entity
        ? {
            email: result?.data?.entity.email,
            enrolmentBank: result?.data?.entity.enrollment_bank,
            enrolmentBranch: result?.data?.entity.enrollment_branch,
            gender: result?.data?.entity.gender,
            image: result?.data?.entity.image,
            lga_of_origin: result?.data?.entity.lga_of_origin,
            lga_of_residence: result?.data?.entity.lga_of_residence,
            residential_address: result?.data?.entity.residential_address,
            state_of_residence: result?.data?.entity.state_of_residence,
          }
        : null,
      reviewNote: '',
    };

    return dojahResult;
  }
}
