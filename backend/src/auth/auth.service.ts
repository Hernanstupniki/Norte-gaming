import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private buildTransporter() {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<string>('SMTP_PORT') || '587');
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!user || !pass) {
      throw new InternalServerErrorException(
        'Configuracion SMTP incompleta. Revisar SMTP_USER y SMTP_PASS.',
      );
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  private getStoreBaseUrl() {
    const explicitFrontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('PUBLIC_WEB_URL');
    if (explicitFrontendUrl?.trim()) {
      return explicitFrontendUrl.trim().replace(/\/+$/, '');
    }

    const domainName = this.configService.get<string>('DOMAIN_NAME');
    if (domainName && domainName !== 'localhost') {
      return `https://nortegaming.${domainName}`;
    }

    const corsOrigin = this.configService.get<string>('CORS_ORIGIN');
    if (corsOrigin?.trim()) {
      return corsOrigin.split(',')[0].trim().replace(/\/+$/, '');
    }

    return 'http://localhost:3000';
  }

  private async sendPasswordResetEmail(params: {
    to: string;
    firstName: string;
    token: string;
    expiresAt: Date;
  }) {
    const smtpUser = this.configService.get<string>('SMTP_USER') || params.to;
    const transporter = this.buildTransporter();
    const resetLink = `${this.getStoreBaseUrl()}/login?recoverToken=${encodeURIComponent(params.token)}`;
    const expiresAtLabel = params.expiresAt.toLocaleString('es-AR', {
      hour12: false,
      timeZone: this.configService.get<string>('GENERIC_TIMEZONE') || 'America/Argentina/Buenos_Aires',
    });

    await transporter.sendMail({
      from: `Norte Gaming <${smtpUser}>`,
      to: params.to,
      subject: 'Recuperacion de contrasena - Norte Gaming',
      text: [
        `Hola ${params.firstName},`,
        '',
        'Recibimos un pedido para recuperar tu contrasena.',
        `Link de recuperacion: ${resetLink}`,
        `Token de recuperacion: ${params.token}`,
        `Vence: ${expiresAtLabel}`,
        '',
        'Si no solicitaste este cambio, ignora este mensaje.',
      ].join('\n'),
      html: `
        <h2>Recuperacion de contrasena</h2>
        <p>Hola <strong>${params.firstName}</strong>,</p>
        <p>Recibimos un pedido para recuperar tu contrasena.</p>
        <p>
          <a href="${resetLink}" target="_blank" rel="noreferrer">
            Hacer click para restablecer
          </a>
        </p>
        <p><strong>Token de recuperacion:</strong> ${params.token}</p>
        <p><strong>Vence:</strong> ${expiresAtLabel}</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
    });
  }

  private async signTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret',
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as never,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as never,
    });

    return { accessToken, refreshToken };
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = await this.signTokens(payload);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    return this.buildAuthResponse(created);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Sesión inválida');
    }

    const valid = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return this.buildAuthResponse(user);
  }

  async logout(userId: string) {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { message: 'Sesión cerrada' };
  }

  async me(userId: string) {
    return this.usersService.getPublicProfileById(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const validPassword = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePasswordHash(userId, newPasswordHash);
    await this.usersService.setRefreshTokenHash(userId, null);

    return { message: 'Contraseña actualizada. Volvé a iniciar sesión.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // No exponemos si existe o no para evitar user enumeration.
    if (!user) {
      return { message: 'Si el email existe, vas a recibir instrucciones.' };
    }

    const token = randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    try {
      await this.sendPasswordResetEmail({
        to: user.email,
        firstName: user.firstName,
        token,
        expiresAt,
      });
    } catch (error) {
      this.logger.error('Error enviando email de recuperacion', error);
      throw new InternalServerErrorException(
        'No se pudo enviar el email de recuperacion.',
      );
    }

    return {
      message: 'Si el email existe, vas a recibir instrucciones.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, refreshTokenHash: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Contraseña restablecida con éxito' };
  }
}
