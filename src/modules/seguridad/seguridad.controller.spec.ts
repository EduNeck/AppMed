import { Test, TestingModule } from '@nestjs/testing';
import { SeguridadController } from './seguridad.controller';
import { SeguridadService } from './seguridad.service';

describe('SeguridadController', () => {
  let controller: SeguridadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeguridadController],
      providers: [
        {
          provide: SeguridadService,
          useValue: {
            listUsers: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            resetPassword: jest.fn(),
            setUserRoles: jest.fn(),
            listRoles: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            listPermisos: jest.fn(),
            setRolePerms: jest.fn(),
            getUserRoles: jest.fn(),
            getRolePerms: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SeguridadController>(SeguridadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
