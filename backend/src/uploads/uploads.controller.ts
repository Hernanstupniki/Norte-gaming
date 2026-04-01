import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage, FileFilterCallback } from 'multer';
import { extname, join } from 'path';
import { Express, Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('product-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Request, _file: Express.Multer.File, cb) => {
          const destinationPath = join(process.cwd(), 'uploads', 'products');
          if (!existsSync(destinationPath)) {
            mkdirSync(destinationPath, { recursive: true });
          }
          cb(null, destinationPath);
        },
        filename: (_req: Request, file: Express.Multer.File, cb) => {
          const extension = extname(file.originalname).toLowerCase();
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extension}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback,
      ) => {
        const isAllowed = /^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype);
        if (!isAllowed) {
          cb(null, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No se recibió una imagen válida. Usá JPG, PNG o WEBP.',
      );
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/products/${file.filename}`;

    return {
      filename: file.filename,
      url,
    };
  }
}
