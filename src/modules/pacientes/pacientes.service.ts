import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as sql from 'mssql';
import { MssqlService } from 'src/database/mssql.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';

const TBL = 'med.paciente'; // <- si tu tabla se llama distinto, cambia aquí

@Injectable()
export class PacientesService {
  constructor(private readonly db: MssqlService) {}

  async list(q?: string) {
    const pool = this.db.getPool();

    const search = (q || '').trim();
    const req = pool.request().input('q', sql.NVarChar(200), `%${search}%`);

    const where = search
      ? `WHERE (p.nombres LIKE @q OR p.apellidos LIKE @q OR p.numero_documento LIKE @q)`
      : '';

    const r = await req.query(`
      SELECT TOP 200
        p.id_paciente, p.tipo_documento, p.numero_documento,
        p.nombres, p.apellidos, p.fecha_nacimiento, p.sexo,
        p.telefono, p.email, p.direccion, p.activo,
        p.created_at
      FROM ${TBL} p
      ${where}
      ORDER BY p.id_paciente DESC;
    `);

    return r.recordset;
  }

  async getById(id: number) {
    const pool = this.db.getPool();
    const r = await pool.request().input('id', sql.BigInt, id).query(`
        SELECT
          p.id_paciente, p.tipo_documento, p.numero_documento,
          p.nombres, p.apellidos, p.fecha_nacimiento, p.sexo,
          p.telefono, p.email, p.direccion, p.activo,
          p.created_at, p.updated_at
        FROM ${TBL} p
        WHERE p.id_paciente=@id;
      `);

    if (!r.recordset.length)
      throw new NotFoundException('Paciente no encontrado');
    return r.recordset[0];
  }

  async create(dto: CreatePacienteDto, actorId?: number) {
    const pool = this.db.getPool();

    // Evitar duplicados por documento (si aplica a tu negocio)
    const ex = await pool
      .request()
      .input('td', sql.NVarChar(20), dto.tipo_documento)
      .input('nd', sql.NVarChar(30), dto.numero_documento)
      .query(
        `SELECT 1 AS x FROM ${TBL} WHERE tipo_documento=@td AND numero_documento=@nd;`,
      );

    if (ex.recordset.length)
      throw new BadRequestException('Paciente ya existe (documento duplicado)');

    const ins = await pool
      .request()
      .input('td', sql.NVarChar(20), dto.tipo_documento)
      .input('nd', sql.NVarChar(30), dto.numero_documento)
      .input('nom', sql.NVarChar(150), dto.nombres)
      .input('ape', sql.NVarChar(150), dto.apellidos)
      .input(
        'fn',
        sql.Date,
        dto.fecha_nacimiento ? new Date(dto.fecha_nacimiento) : null,
      )
      .input('sx', sql.NVarChar(10), dto.sexo ?? null)
      .input('tel', sql.NVarChar(30), dto.telefono ?? null)
      .input('em', sql.NVarChar(120), dto.email ?? null)
      .input('dir', sql.NVarChar(300), dto.direccion ?? null)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO ${TBL}
          (tipo_documento, numero_documento, nombres, apellidos, fecha_nacimiento, sexo, telefono, email, direccion, activo, created_by)
        OUTPUT INSERTED.id_paciente AS id_paciente
        VALUES
          (@td,@nd,@nom,@ape,@fn,@sx,@tel,@em,@dir,1,@created_by);
      `);

    return { id_paciente: ins.recordset[0].id_paciente };
  }

  async update(id: number, dto: UpdatePacienteDto, actorId?: number) {
    const pool = this.db.getPool();

    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_paciente FROM ${TBL} WHERE id_paciente=@id;`);

    if (!check.recordset.length)
      throw new NotFoundException('Paciente no encontrado');

    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('td', sql.NVarChar(20), dto.tipo_documento ?? null)
      .input('nd', sql.NVarChar(30), dto.numero_documento ?? null)
      .input('nom', sql.NVarChar(150), dto.nombres ?? null)
      .input('ape', sql.NVarChar(150), dto.apellidos ?? null)
      .input(
        'fn',
        sql.Date,
        dto.fecha_nacimiento ? new Date(dto.fecha_nacimiento) : null,
      )
      .input('sx', sql.NVarChar(10), dto.sexo ?? null)
      .input('tel', sql.NVarChar(30), dto.telefono ?? null)
      .input('em', sql.NVarChar(120), dto.email ?? null)
      .input('dir', sql.NVarChar(300), dto.direccion ?? null)
      .input('act', sql.Bit, dto.activo ?? null)
      .input('updated_by', sql.BigInt, actorId ?? null).query(`
        UPDATE ${TBL}
        SET
          tipo_documento = COALESCE(@td, tipo_documento),
          numero_documento = COALESCE(@nd, numero_documento),
          nombres = COALESCE(@nom, nombres),
          apellidos = COALESCE(@ape, apellidos),
          fecha_nacimiento = COALESCE(@fn, fecha_nacimiento),
          sexo = COALESCE(@sx, sexo),
          telefono = COALESCE(@tel, telefono),
          email = COALESCE(@em, email),
          direccion = COALESCE(@dir, direccion),
          activo = COALESCE(@act, activo),
          updated_at = SYSDATETIME(),
          updated_by = @updated_by
        WHERE id_paciente=@id;
      `);

    return { ok: true };
  }

  async delete(id: number, actorId?: number) {
    const pool = this.db.getPool();

    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_paciente FROM ${TBL} WHERE id_paciente=@id;`);

    if (!check.recordset.length)
      throw new NotFoundException('Paciente no encontrado');

    // Soft delete: marcamos como inactivo en lugar de eliminar
    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('updated_by', sql.BigInt, actorId ?? null).query(`
        UPDATE ${TBL}
        SET
          activo = 0,
          updated_at = SYSDATETIME(),
          updated_by = @updated_by
        WHERE id_paciente=@id;
      `);

    return { ok: true };
  }
}
