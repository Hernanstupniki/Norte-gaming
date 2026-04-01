import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/public.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin/all')
  listAdmin() {
    return this.contactsService.listAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) {
    return this.contactsService.updateStatus(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
