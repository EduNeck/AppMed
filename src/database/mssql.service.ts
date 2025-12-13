import { Injectable, OnModuleInit } from '@nestjs/common';
import * as sql from 'mssql';

@Injectable()
export class MssqlService implements OnModuleInit {
  private pool!: sql.ConnectionPool;

  async onModuleInit() {
    this.pool = await new sql.ConnectionPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      server: process.env.DB_HOST,
      database: process.env.DB_NAME,
      options: {
        encrypt: String(process.env.DB_ENCRYPT).toLowerCase() === 'true',
        trustServerCertificate: true,
      },
    }).connect();
  }

  getPool(): sql.ConnectionPool {
    return this.pool;
  }

  async setAuditContext(ctx: {
    userId?: number;
    username?: string;
    modulo?: string;
    ip?: string;
    ua?: string;
  }) {
    // Ejecuta en la MISMA conexión/pool antes del DML para que los triggers lo vean.
    // Nota: usamos parámetros para evitar inyección.
    if (ctx.userId !== undefined) {
      await this.pool
        .request()
        .input('v', sql.BigInt, ctx.userId)
        .query("EXEC sp_set_session_context @key=N'user_id', @value=@v;");
    }
    if (ctx.username) {
      await this.pool
        .request()
        .input('v', sql.NVarChar(80), ctx.username)
        .query("EXEC sp_set_session_context @key=N'username', @value=@v;");
    }
    if (ctx.modulo) {
      await this.pool
        .request()
        .input('v', sql.NVarChar(60), ctx.modulo)
        .query("EXEC sp_set_session_context @key=N'modulo', @value=@v;");
    }
    if (ctx.ip) {
      await this.pool
        .request()
        .input('v', sql.NVarChar(45), ctx.ip)
        .query("EXEC sp_set_session_context @key=N'ip', @value=@v;");
    }
    if (ctx.ua) {
      await this.pool
        .request()
        .input('v', sql.NVarChar(300), ctx.ua)
        .query("EXEC sp_set_session_context @key=N'ua', @value=@v;");
    }
  }
}
