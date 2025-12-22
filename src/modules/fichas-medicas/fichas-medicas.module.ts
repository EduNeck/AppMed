import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { FichasMedicasController } from './fichas-medicas.controller';
import { FichasMedicasService } from './fichas-medicas.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FichasMedicasController],
  providers: [FichasMedicasService],
  exports: [FichasMedicasService],
})
export class FichasMedicasModule {}
