import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsRoot = join(process.cwd(), 'uploads');
  const productUploads = join(uploadsRoot, 'products');
  if (!existsSync(productUploads)) {
    mkdirSync(productUploads, { recursive: true });
  }

  app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });
  app.setGlobalPrefix('api');
  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  if (process.env.NODE_ENV === 'production' && !corsOrigin) {
    throw new Error('CORS_ORIGIN es obligatorio en produccion');
  }
  app.enableCors({
    origin: corsOrigin?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Norte Gaming API')
    .setDescription('Backend ecommerce escalable para Norte Gaming')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(Number(process.env.PORT) || 4000);
}
void bootstrap();
