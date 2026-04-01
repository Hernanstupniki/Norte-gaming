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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressesService } from './addresses.service';

@ApiTags('addresses')
@ApiBearerAuth()
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get('me')
  listMy(@CurrentUser('sub') userId: string) {
    return this.addressesService.listMyAddresses(userId);
  }

  @Post('me')
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(userId, dto);
  }

  @Patch('me/:id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(userId, id, dto);
  }

  @Patch('me/:id/primary')
  setPrimary(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.addressesService.setPrimary(userId, id);
  }

  @Delete('me/:id')
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.addressesService.remove(userId, id);
  }
}
