import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/public.decorator';
import {
  CreatePaymentDto,
  UpdatePaymentStatusDto,
} from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }


  @Public()
  @Post('mercadopago/webhook')
  mercadopagoWebhook(@Body() payload: Record<string, unknown>, @Query() query: Record<string, string>) {
    return this.paymentsService.handleMercadoPagoWebhook({
      ...(payload as Record<string, unknown>),
      id: query.id ?? (payload.id as string | number | undefined),
      type: query.type ?? (payload.type as string | undefined),
      action: query.action ?? (payload.action as string | undefined),
    });
  }

  @Get('me')
  listMy(@CurrentUser('sub') userId: string) {
    return this.paymentsService.listMy(userId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/all')
  listAdmin() {
    return this.paymentsService.listAdmin();
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.paymentsService.updateStatus(id, dto);
  }
}
