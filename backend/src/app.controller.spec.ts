import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('reports the exact deployed commit', () => {
      process.env.APP_COMMIT_SHA = 'test-commit';

      expect(appController.getHealth()).toEqual(
        expect.objectContaining({
          ok: true,
          status: 'ok',
          service: 'api',
          commit: 'test-commit',
        }),
      );

      delete process.env.APP_COMMIT_SHA;
    });
  });
});
