import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { errorResponse } from '../http/api-response.js';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}

  transform(value: unknown) {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      throw new BadRequestException(
        errorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          parsed.error.issues.map(
            (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`,
          ),
        ),
      );
    }

    return parsed.data;
  }
}
