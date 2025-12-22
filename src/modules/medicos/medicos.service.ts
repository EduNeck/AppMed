import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as sql from 'mssql';
import { MssqlService } from 'src/database/mssql.service';
import { CreateMedicoDto } from './dto/create-medico.dto';
import { SetMedicoEspecialidadesDto } from './dto/set-medico-especialidades.dto';
import { UpdateMedicoDto } from './dto/update-medico.dto';

const TBL_MEDICO = 'med.medico';
const TBL_ESPECIALIDAD = 'med.especialidad';
const TBL_MEDICO_ESPECIALIDAD = 'med.medico_especialidad';

@Injectable()
export class MedicosService {
  constructor(private readonly db: MssqlService) {}

  async list(q?: string) {
    const pool = this.db.getPool();

    const search = (q || '').trim();
    const req = pool.request().input('q', sql.NVarChar(200), `%${search}%`);

    const where = search
      ? `WHERE (m.nombres LIKE @q OR m.apellidos LIKE @q OR m.numero_documento LIKE @q OR m.numero_colegiatura LIKE @q)`
      : '';

    const r = await req.query(`
      SELECT TOP 200
        m.id_medico, m.tipo_documento, m.numero_documento,
        m.nombres, m.apellidos, m.telefono, m.email, 
        m.numero_colegiatura, m.direccion, m.activo,
        m.created_at,
        -- Concatenar especialidades
        STUFF((
          SELECT ', ' + e.nombre
          FROM ${TBL_MEDICO_ESPECIALIDAD} me
          INNER JOIN ${TBL_ESPECIALIDAD} e ON me.id_especialidad = e.id_especialidad
          WHERE me.id_medico = m.id_medico AND e.activo = 1
          FOR XML PATH('')
        ), 1, 2, '') AS especialidades
      FROM ${TBL_MEDICO} m
      ${where}
      ORDER BY m.id_medico DESC;
    `);

    return r.recordset;
  }

  async getById(id: number) {
    const pool = this.db.getPool();

    // Obtener datos del médico
    const medico = await pool.request().input('id', sql.BigInt, id).query(`
      SELECT
        m.id_medico, m.tipo_documento, m.numero_documento,
        m.nombres, m.apellidos, m.telefono, m.email,
        m.numero_colegiatura, m.direccion, m.activo,
        m.created_at, m.updated_at
      FROM ${TBL_MEDICO} m
      WHERE m.id_medico = @id;
    `);

    if (!medico.recordset.length)
      throw new NotFoundException('Médico no encontrado');

    // Obtener especialidades del médico
    const especialidades = await pool.request().input('id', sql.BigInt, id)
      .query(`
      SELECT 
        e.id_especialidad, e.nombre, e.descripcion,
        me.fecha_certificacion
      FROM ${TBL_MEDICO_ESPECIALIDAD} me
      INNER JOIN ${TBL_ESPECIALIDAD} e ON me.id_especialidad = e.id_especialidad
      WHERE me.id_medico = @id AND e.activo = 1
      ORDER BY e.nombre;
    `);

    return {
      ...medico.recordset[0],
      especialidades: especialidades.recordset,
    };
  }

  async create(dto: CreateMedicoDto, actorId?: number) {
    const pool = this.db.getPool();

    // Verificar duplicados por documento
    const existeDoc = await pool
      .request()
      .input('td', sql.NVarChar(20), dto.tipo_documento)
      .input('nd', sql.NVarChar(30), dto.numero_documento)
      .query(
        `SELECT 1 AS x FROM ${TBL_MEDICO} WHERE tipo_documento=@td AND numero_documento=@nd;`,
      );

    if (existeDoc.recordset.length)
      throw new BadRequestException('Médico ya existe (documento duplicado)');

    // Verificar duplicados por número de colegiatura
    const existeColegiatura = await pool
      .request()
      .input('nc', sql.NVarChar(50), dto.numero_colegiatura)
      .query(`SELECT 1 AS x FROM ${TBL_MEDICO} WHERE numero_colegiatura=@nc;`);

    if (existeColegiatura.recordset.length)
      throw new BadRequestException('Número de colegiatura ya existe');

    const ins = await pool
      .request()
      .input('td', sql.NVarChar(20), dto.tipo_documento)
      .input('nd', sql.NVarChar(30), dto.numero_documento)
      .input('nom', sql.NVarChar(150), dto.nombres)
      .input('ape', sql.NVarChar(150), dto.apellidos)
      .input('tel', sql.NVarChar(30), dto.telefono ?? null)
      .input('em', sql.NVarChar(120), dto.email ?? null)
      .input('nc', sql.NVarChar(50), dto.numero_colegiatura)
      .input('dir', sql.NVarChar(300), dto.direccion ?? null)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO ${TBL_MEDICO}
          (tipo_documento, numero_documento, nombres, apellidos, telefono, email, numero_colegiatura, direccion, activo, created_by)
        OUTPUT INSERTED.id_medico AS id_medico
        VALUES
          (@td,@nd,@nom,@ape,@tel,@em,@nc,@dir,1,@created_by);
      `);

    return { id_medico: ins.recordset[0].id_medico };
  }

  async update(id: number, dto: UpdateMedicoDto, actorId?: number) {
    const pool = this.db.getPool();

    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_medico FROM ${TBL_MEDICO} WHERE id_medico=@id;`);

    if (!check.recordset.length)
      throw new NotFoundException('Médico no encontrado');

    // Verificar duplicado de colegiatura si se está actualizando
    if (dto.numero_colegiatura) {
      const existeColegiatura = await pool
        .request()
        .input('nc', sql.NVarChar(50), dto.numero_colegiatura)
        .input('id', sql.BigInt, id)
        .query(
          `SELECT 1 AS x FROM ${TBL_MEDICO} WHERE numero_colegiatura=@nc AND id_medico != @id;`,
        );

      if (existeColegiatura.recordset.length)
        throw new BadRequestException('Número de colegiatura ya existe');
    }

    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('td', sql.NVarChar(20), dto.tipo_documento ?? null)
      .input('nd', sql.NVarChar(30), dto.numero_documento ?? null)
      .input('nom', sql.NVarChar(150), dto.nombres ?? null)
      .input('ape', sql.NVarChar(150), dto.apellidos ?? null)
      .input('tel', sql.NVarChar(30), dto.telefono ?? null)
      .input('em', sql.NVarChar(120), dto.email ?? null)
      .input('nc', sql.NVarChar(50), dto.numero_colegiatura ?? null)
      .input('dir', sql.NVarChar(300), dto.direccion ?? null)
      .input('act', sql.Bit, dto.activo ?? null)
      .input('updated_by', sql.BigInt, actorId ?? null).query(`
        UPDATE ${TBL_MEDICO}
        SET
          tipo_documento = COALESCE(@td, tipo_documento),
          numero_documento = COALESCE(@nd, numero_documento),
          nombres = COALESCE(@nom, nombres),
          apellidos = COALESCE(@ape, apellidos),
          telefono = COALESCE(@tel, telefono),
          email = COALESCE(@em, email),
          numero_colegiatura = COALESCE(@nc, numero_colegiatura),
          direccion = COALESCE(@dir, direccion),
          activo = COALESCE(@act, activo),
          updated_at = SYSDATETIME(),
          updated_by = @updated_by
        WHERE id_medico=@id;
      `);

    return { ok: true };
  }

  async delete(id: number, actorId?: number) {
    const pool = this.db.getPool();

    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_medico FROM ${TBL_MEDICO} WHERE id_medico=@id;`);

    if (!check.recordset.length)
      throw new NotFoundException('Médico no encontrado');

    // Soft delete: marcamos como inactivo
    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('updated_by', sql.BigInt, actorId ?? null).query(`
        UPDATE ${TBL_MEDICO}
        SET
          activo = 0,
          updated_at = SYSDATETIME(),
          updated_by = @updated_by
        WHERE id_medico=@id;
      `);

    return { ok: true };
  }

  // ================== ESPECIALIDADES ==================

  async setEspecialidades(
    id: number,
    dto: SetMedicoEspecialidadesDto,
    actorId?: number,
  ) {
    const pool = this.db.getPool();

    // Verificar que el médico existe
    const check = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query(`SELECT id_medico FROM ${TBL_MEDICO} WHERE id_medico=@id;`);

    if (!check.recordset.length)
      throw new NotFoundException('Médico no encontrado');

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Eliminar especialidades actuales
      await transaction
        .request()
        .input('id_medico', sql.BigInt, id)
        .query(
          `DELETE FROM ${TBL_MEDICO_ESPECIALIDAD} WHERE id_medico = @id_medico`,
        );

      // Insertar nuevas especialidades
      for (const idEspecialidad of dto.especialidades) {
        await transaction
          .request()
          .input('id_medico', sql.BigInt, id)
          .input('id_especialidad', sql.BigInt, idEspecialidad).query(`
            INSERT INTO ${TBL_MEDICO_ESPECIALIDAD} (id_medico, id_especialidad, fecha_certificacion)
            VALUES (@id_medico, @id_especialidad, SYSDATETIME())
          `);
      }

      await transaction.commit();
      return { ok: true };
    } catch (error) {
      await transaction.rollback();
      throw new BadRequestException('Error al asignar especialidades');
    }
  }

  async listEspecialidades() {
    const pool = this.db.getPool();
    const r = await pool.request().query(`
      SELECT id_especialidad, nombre, descripcion, activo
      FROM ${TBL_ESPECIALIDAD}
      WHERE activo = 1
      ORDER BY nombre;
    `);
    return r.recordset;
  }
}
