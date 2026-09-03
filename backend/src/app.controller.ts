import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      ok: true,
      status: 'ok',
      service: 'api',
      commit: process.env.APP_COMMIT_SHA?.trim() || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}
