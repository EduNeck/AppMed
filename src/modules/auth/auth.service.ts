import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as sql from 'mssql';
import { MssqlService } from 'src/database/mssql.service';

@Injectable()
export class AuthService {
  constructor(
    private db: MssqlService,
    private jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const pool = this.db.getPool();

    const user = await pool
      .request()
      .input('username', sql.NVarChar(80), username).query(`
        SELECT TOP 1
          u.id_usuario,
          u.username,
          u.hash_password,
          u.activo
        FROM seg.usuario u
        WHERE u.username = @username
      `);

    if (!user.recordset.length)
      throw new UnauthorizedException('Credenciales inválidas');

    const u = user.recordset[0];
    if (!u.activo) throw new UnauthorizedException('Usuario inactivo');

    const ok = await bcrypt.compare(password, u.hash_password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const perms = await this.getPermisos(u.id_usuario);

    const payload = {
      sub: Number(u.id_usuario),
      username: u.username,
      perms,
    };

    const access_token = await this.jwt.signAsync(payload);

    // Actualiza último login (esto quedará auditado si tienes trigger, si no, igual ok)
    await pool
      .request()
      .input('id', sql.BigInt, u.id_usuario)
      .query(
        `UPDATE seg.usuario SET ultimo_login = SYSDATETIME() WHERE id_usuario = @id;`,
      );

    return {
      access_token,
      user: { id: u.id_usuario, username: u.username },
      perms,
    };
  }

  async me(userId: number) {
    const pool = this.db.getPool();
    const u = await pool
      .request()
      .input('id', sql.BigInt, userId)
      .query(
        `SELECT id_usuario, username, email, nombres, apellidos, activo FROM seg.usuario WHERE id_usuario=@id;`,
      );

    if (!u.recordset.length)
      throw new UnauthorizedException('Usuario no encontrado');

    const perms = await this.getPermisos(userId);

    return { user: u.recordset[0], perms };
  }

  private async getPermisos(userId: number): Promise<string[]> {
    const pool = this.db.getPool();
    const r = await pool.request().input('id', sql.BigInt, userId).query(`
        SELECT DISTINCT p.codigo
        FROM seg.usuario_rol ur
        JOIN seg.rol_permiso rp ON rp.id_rol = ur.id_rol
        JOIN seg.permiso p ON p.id_permiso = rp.id_permiso
        WHERE ur.id_usuario = @id AND p.activo = 1
        ORDER BY p.codigo
      `);

    return r.recordset.map((x: any) => x.codigo);
  }
}
