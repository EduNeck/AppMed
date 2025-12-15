import { Test, TestingModule } from '@nestjs/testing';
import { SeguridadController } from './seguridad.controller';

describe('SeguridadController', () => {
  let controller: SeguridadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeguridadController],
    }).compile();

    controller = module.get<SeguridadController>(SeguridadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
