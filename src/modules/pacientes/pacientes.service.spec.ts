import { Test, TestingModule } from '@nestjs/testing';
import { PacientesService } from './pacientes.service';
import { MssqlService } from 'src/database/mssql.service';

describe('PacientesService', () => {
  let service: PacientesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PacientesService,
        {
          provide: MssqlService,
          useValue: { getPool: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PacientesService>(PacientesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
