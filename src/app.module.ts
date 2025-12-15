import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeguridadModule } from './modules/seguridad/seguridad.module';
import { PacientesModule } from './modules/pacientes/pacientes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    SeguridadModule,
    PacientesModule,
  ],
})
export class AppModule {}
