import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
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
      auth: {
        user,
        pass,
      },
    });
  }

  private async sendContactEmail(dto: CreateContactDto) {
    const receiver =
      this.configService.get<string>('CONTACT_RECEIVER_EMAIL') ||
      'nortegamingba@gmail.com';
    const user = this.configService.get<string>('SMTP_USER') || receiver;
    const transporter = this.buildTransporter();

    const subject = `[Consulta Web] ${dto.subject}`;

    const text = [
      'Nueva consulta recibida desde la web.',
      '',
      `Nombre: ${dto.name}`,
      `Email: ${dto.email}`,
      `Telefono: ${dto.phone || 'No informado'}`,
      `Asunto: ${dto.subject}`,
      '',
      'Mensaje:',
      dto.message,
    ].join('\n');

    await transporter.sendMail({
      from: `Norte Gaming <${user}>`,
      to: receiver,
      replyTo: dto.email,
      subject,
      text,
      html: `
        <h2>Nueva consulta recibida desde la web</h2>
        <p><strong>Nombre:</strong> ${dto.name}</p>
        <p><strong>Email:</strong> ${dto.email}</p>
        <p><strong>Telefono:</strong> ${dto.phone || 'No informado'}</p>
        <p><strong>Asunto:</strong> ${dto.subject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${dto.message.replace(/\n/g, '<br/>')}</p>
      `,
    });
  }

  async create(dto: CreateContactDto) {
    const created = await this.prisma.contact.create({ data: dto });

    try {
      await this.sendContactEmail(dto);
    } catch (error) {
      this.logger.error('Error enviando correo de consulta', error);
      throw new InternalServerErrorException(
        'La consulta se guardo, pero no se pudo enviar por correo.',
      );
    }

    return created;
  }

  listAdmin() {
    return this.prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(id: string, dto: UpdateContactStatusDto) {
    const found = await this.prisma.contact.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return this.prisma.contact.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    const found = await this.prisma.contact.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return this.prisma.contact.delete({ where: { id } });
  }
}
