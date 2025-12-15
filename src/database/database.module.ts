import { Module } from '@nestjs/common';
import { MssqlService } from './mssql.service';

@Module({
  providers: [MssqlService],
  exports: [MssqlService], // 👈 obligatorio
})
export class DatabaseModule {}
