import { ContactStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateContactStatusDto {
  @IsEnum(ContactStatus)
  status: ContactStatus;
}
