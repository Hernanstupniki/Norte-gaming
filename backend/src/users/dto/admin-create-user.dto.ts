import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class AdminCreateUserDto {
  @IsString()
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MaxLength(80)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsPhoneNumber('AR')
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
