import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { MssqlService } from './database/mssql.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Seguridad: HTTP headers
  app.use(helmet());

  // Configurar CORS usando variable de entorno (lista separada por comas)
  const rawOrigins = process.env.CORS_ORIGINS || 'http://localhost:9000';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const db = app.get(MssqlService);
  app.useGlobalInterceptors(new AuditInterceptor(db));

  const port = Number(process.env.APP_PORT || 3000);
  await app.listen(port);
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
}
bootstrap();
