import { Test, TestingModule } from '@nestjs/testing';
import { SeguridadService } from './seguridad.service';

describe('SeguridadService', () => {
  let service: SeguridadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeguridadService],
    }).compile();

    service = module.get<SeguridadService>(SeguridadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
