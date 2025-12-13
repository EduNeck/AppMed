import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MssqlService } from 'src/database/mssql.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private db: MssqlService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const modulo = (req.baseUrl?.split('/')[1] || 'APP').toUpperCase();
    const ip =
      req.headers['x-forwarded-for']?.toString()?.split(',')[0] || req.ip;
    const ua = req.headers['user-agent'] || '';

    // Setea el contexto para que triggers auditen correctamente
    await this.db.setAuditContext({
      userId: user?.sub,
      username: user?.username,
      modulo,
      ip,
      ua,
    });

    return next.handle();
  }
}
