import { Test, TestingModule } from '@nestjs/testing';
import { SeguridadService } from './seguridad.service';
import { MssqlService } from 'src/database/mssql.service';

describe('SeguridadService', () => {
  let service: SeguridadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeguridadService,
        {
          provide: MssqlService,
          useValue: { getPool: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SeguridadService>(SeguridadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
