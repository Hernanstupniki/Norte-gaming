import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter<Prisma.PrismaClientKnownRequestError> {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let statusCode = HttpStatus.BAD_REQUEST;
    let message = 'Error de base de datos';

    if (exception.code === 'P2002') {
      statusCode = HttpStatus.CONFLICT;
      message = 'Registro duplicado';
    }

    if (exception.code === 'P2025') {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Registro no encontrado';
    }

    response.status(statusCode).json({
      statusCode,
      message,
      code: exception.code,
      meta: exception.meta,
      timestamp: new Date().toISOString(),
    });
  }
}
