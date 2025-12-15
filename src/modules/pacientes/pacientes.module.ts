import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PacientesController],
  providers: [PacientesService],
})
export class PacientesModule {}
