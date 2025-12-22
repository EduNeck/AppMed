import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { FichasMedicasModule } from './modules/fichas-medicas/fichas-medicas.module';
import { MedicosModule } from './modules/medicos/medicos.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';
import { SeguridadModule } from './modules/seguridad/seguridad.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    SeguridadModule,
    PacientesModule,
    MedicosModule,
    FichasMedicasModule,
  ],
})
export class AppModule {}
