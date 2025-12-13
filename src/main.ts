import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { MssqlService } from './database/mssql.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const db = app.get(MssqlService);
  app.useGlobalInterceptors(new AuditInterceptor(db));

  const port = Number(process.env.APP_PORT || 3001);
  await app.listen(port);
}
bootstrap();
