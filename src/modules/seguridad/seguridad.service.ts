import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as sql from 'mssql';
import { MssqlService } from 'src/database/mssql.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetRolePermsDto } from './dto/set-role-perms.dto';
import { SetUserRolesDto } from './dto/set-user-roles.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class SeguridadService {
  constructor(private readonly db: MssqlService) {}

  // -------------------- USUARIOS --------------------
  async listUsers() {
    const pool = this.db.getPool();
    const r = await pool.request().query(`
      SELECT id_usuario, username, email, nombres, apellidos, activo, debe_cambiar_pw, ultimo_login, created_at
      FROM seg.usuario
      ORDER BY id_usuario DESC
    `);
    return r.recordset;
  }

  async createUser(dto: CreateUserDto, actorId?: number) {
    const pool = this.db.getPool();

    // evita duplicados rápido
    const exists = await pool
      .request()
      .input('username', sql.NVarChar(80), dto.username)
      .query(`SELECT 1 AS x FROM seg.usuario WHERE username=@username;`);

    if (exists.recordset.length)
      throw new BadRequestException('Username ya existe');

    const hash = await bcrypt.hash(dto.password, 12);

    const ins = await pool
      .request()
      .input('username', sql.NVarChar(80), dto.username)
      .input('email', sql.NVarChar(120), dto.email ?? null)
      .input('nombres', sql.NVarChar(150), dto.nombres)
      .input('apellidos', sql.NVarChar(150), dto.apellidos ?? null)
      .input('hash', sql.NVarChar(255), hash)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO seg.usuario(username,email,nombres,apellidos,hash_password,activo,debe_cambiar_pw,created_by)
        OUTPUT INSERTED.id_usuario AS id_usuario
        VALUES (@username,@email,@nombres,@apellidos,@hash,1,0,@created_by);
      `);

    return { id_usuario: ins.recordset[0].id_usuario };
  }

  async updateUser(id: number, dto: UpdateUserDto, actorId?: number) {
    const pool = this.db.getPool();

    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_usuario FROM seg.usuario WHERE id_usuario=@id;`);

    if (!check.recordset.length)
      throw new NotFoundException('Usuario no encontrado');

    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('email', sql.NVarChar(120), dto.email ?? null)
      .input('nombres', sql.NVarChar(150), dto.nombres ?? null)
      .input('apellidos', sql.NVarChar(150), dto.apellidos ?? null)
      .input('activo', sql.Bit, dto.activo ?? null)
      .input('debe', sql.Bit, dto.debe_cambiar_pw ?? null)
      .input('updated_by', sql.BigInt, actorId ?? null).query(`
        UPDATE seg.usuario
        SET
          email = COALESCE(@email, email),
          nombres = COALESCE(@nombres, nombres),
          apellidos = COALESCE(@apellidos, apellidos),
          activo = COALESCE(@activo, activo),
          debe_cambiar_pw = COALESCE(@debe, debe_cambiar_pw),
          updated_at = SYSDATETIME(),
          updated_by = @updated_by
        WHERE id_usuario=@id;
      `);

    return { ok: true };
  }

  async resetPassword(id: number, dto: ResetPasswordDto, actorId?: number) {
    const pool = this.db.getPool();

    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_usuario FROM seg.usuario WHERE id_usuario=@id;`);

    if (!check.recordset.length)
      throw new NotFoundException('Usuario no encontrado');

    const hash = await bcrypt.hash(dto.newPassword, 12);

    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('hash', sql.NVarChar(255), hash)
      .input('force', sql.Bit, dto.forceChange ? 1 : 0)
      .input('updated_by', sql.BigInt, actorId ?? null).query(`
        UPDATE seg.usuario
        SET hash_password=@hash,
            debe_cambiar_pw=@force,
            updated_at=SYSDATETIME(),
            updated_by=@updated_by
        WHERE id_usuario=@id;
      `);

    return { ok: true };
  }

  async setUserRoles(userId: number, dto: SetUserRolesDto, actorId?: number) {
    const pool = this.db.getPool();
    const tx = new sql.Transaction(pool);

    await tx.begin();
    try {
      // 1) valida usuario
      const u = await new sql.Request(tx)
        .input('uid', sql.BigInt, userId)
        .query(`SELECT id_usuario FROM seg.usuario WHERE id_usuario=@uid;`);

      if (!u.recordset.length)
        throw new NotFoundException('Usuario no encontrado');

      // 2) borra roles actuales
      await new sql.Request(tx)
        .input('uid', sql.BigInt, userId)
        .query(`DELETE FROM seg.usuario_rol WHERE id_usuario=@uid;`);

      // 3) inserta nuevos (un Request nuevo por iteración)
      for (const rid of dto.roleIds) {
        await new sql.Request(tx)
          .input('uid', sql.BigInt, userId)
          .input('rid', sql.BigInt, rid)
          .input('asigby', sql.BigInt, actorId ?? null).query(`
            INSERT INTO seg.usuario_rol(id_usuario,id_rol,asignado_by)
            VALUES (@uid,@rid,@asigby);
            `);
      }

      await tx.commit();
      return { ok: true };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }

  // -------------------- ROLES --------------------
  async listRoles() {
    const pool = this.db.getPool();
    const r = await pool.request().query(`
      SELECT id_rol, codigo, nombre, descripcion, activo, created_at
      FROM seg.rol
      ORDER BY id_rol DESC
    `);
    return r.recordset;
  }

  async createRole(dto: CreateRoleDto, actorId?: number) {
    const pool = this.db.getPool();

    const exists = await pool
      .request()
      .input('codigo', sql.NVarChar(50), dto.codigo)
      .query(`SELECT 1 AS x FROM seg.rol WHERE codigo=@codigo;`);
    if (exists.recordset.length)
      throw new BadRequestException('Código de rol ya existe');

    const ins = await pool
      .request()
      .input('codigo', sql.NVarChar(50), dto.codigo)
      .input('nombre', sql.NVarChar(120), dto.nombre)
      .input('desc', sql.NVarChar(300), dto.descripcion ?? null)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO seg.rol(codigo,nombre,descripcion,activo,created_by)
        OUTPUT INSERTED.id_rol AS id_rol
        VALUES (@codigo,@nombre,@desc,1,@created_by);
      `);

    return { id_rol: ins.recordset[0].id_rol };
  }

  async updateRole(id: number, dto: UpdateRoleDto, actorId?: number) {
    const pool = this.db.getPool();

    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_rol FROM seg.rol WHERE id_rol=@id;`);
    if (!check.recordset.length)
      throw new NotFoundException('Rol no encontrado');

    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('codigo', sql.NVarChar(50), dto.codigo ?? null)
      .input('nombre', sql.NVarChar(120), dto.nombre ?? null)
      .input('desc', sql.NVarChar(300), dto.descripcion ?? null)
      .input('activo', sql.Bit, dto.activo ?? null)
      .input('updated_by', sql.BigInt, actorId ?? null).query(`
        UPDATE seg.rol
        SET
          codigo = COALESCE(@codigo, codigo),
          nombre = COALESCE(@nombre, nombre),
          descripcion = COALESCE(@desc, descripcion),
          activo = COALESCE(@activo, activo),
          updated_at = SYSDATETIME(),
          updated_by = @updated_by
        WHERE id_rol=@id;
      `);

    return { ok: true };
  }

  async listPermisos() {
    const pool = this.db.getPool();
    const r = await pool.request().query(`
      SELECT id_permiso, codigo, nombre, modulo, descripcion, activo
      FROM seg.permiso
      ORDER BY modulo, codigo
    `);
    return r.recordset;
  }

  async setRolePerms(roleId: number, dto: SetRolePermsDto) {
    const pool = this.db.getPool();
    const tx = new sql.Transaction(pool);

    await tx.begin();
    try {
      // 1) valida rol
      const r = await new sql.Request(tx)
        .input('rid', sql.BigInt, roleId)
        .query(`SELECT id_rol FROM seg.rol WHERE id_rol=@rid;`);

      if (!r.recordset.length) throw new NotFoundException('Rol no encontrado');

      // 2) borra permisos actuales
      await new sql.Request(tx)
        .input('rid', sql.BigInt, roleId)
        .query(`DELETE FROM seg.rol_permiso WHERE id_rol=@rid;`);

      // 3) inserta nuevos
      for (const pid of dto.permIds) {
        await new sql.Request(tx)
          .input('rid', sql.BigInt, roleId)
          .input('pid', sql.BigInt, pid)
          .query(
            `INSERT INTO seg.rol_permiso(id_rol,id_permiso) VALUES (@rid,@pid);`,
          );
      }

      await tx.commit();
      return { ok: true };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }

  async getUserRoles(userId: number) {
    const pool = this.db.getPool();
    const r = await pool.request().input('uid', sql.BigInt, userId).query(`
        SELECT r.id_rol, r.codigo, r.nombre
        FROM seg.usuario_rol ur
        JOIN seg.rol r ON r.id_rol = ur.id_rol
        WHERE ur.id_usuario=@uid
        ORDER BY r.codigo;
      `);
    return r.recordset;
  }

  async getRolePerms(roleId: number) {
    const pool = this.db.getPool();
    const r = await pool.request().input('rid', sql.BigInt, roleId).query(`
        SELECT p.id_permiso, p.codigo, p.nombre, p.modulo
        FROM seg.rol_permiso rp
        JOIN seg.permiso p ON p.id_permiso = rp.id_permiso
        WHERE rp.id_rol=@rid
        ORDER BY p.modulo, p.codigo;
      `);
    return r.recordset;
  }
}
