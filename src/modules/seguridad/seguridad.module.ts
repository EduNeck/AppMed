import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { SeguridadController } from './seguridad.controller';
import { SeguridadService } from './seguridad.service';

@Module({
  imports: [DatabaseModule], // 👈 esto es lo importante
  controllers: [SeguridadController],
  providers: [SeguridadService],
})
export class SeguridadModule {}
