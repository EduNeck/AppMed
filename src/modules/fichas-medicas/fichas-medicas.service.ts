import { Injectable, NotFoundException } from '@nestjs/common';
import * as sql from 'mssql';
import { MssqlService } from 'src/database/mssql.service';
import { CreateAntecedenteDto } from './dto/create-antecedente.dto';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';
import { CreateEvolucionDto } from './dto/create-evolucion.dto';
import { CreateSignosVitalesDto } from './dto/create-signos-vitales.dto';

const TBL_CONSULTA = 'med.consulta';
const TBL_SIGNOS_VITALES = 'med.signos_vitales';
const TBL_DIAGNOSTICO = 'med.diagnostico';
const TBL_ANTECEDENTE = 'med.antecedente';
const TBL_EVOLUCION = 'med.evolucion';
const TBL_PACIENTE = 'med.paciente';
const TBL_MEDICO = 'med.medico';

@Injectable()
export class FichasMedicasService {
  constructor(private readonly db: MssqlService) {}

  // ==================== CONSULTAS ====================

  async createConsulta(dto: CreateConsultaDto, actorId?: number) {
    const pool = this.db.getPool();

    // Verificar que paciente y médico existen
    const verificacion = await pool
      .request()
      .input('id_paciente', sql.BigInt, dto.id_paciente)
      .input('id_medico', sql.BigInt, dto.id_medico).query(`
        SELECT 
          (SELECT COUNT(*) FROM ${TBL_PACIENTE} WHERE id_paciente = @id_paciente AND activo = 1) as paciente_existe,
          (SELECT COUNT(*) FROM ${TBL_MEDICO} WHERE id_medico = @id_medico AND activo = 1) as medico_existe
      `);

    const { paciente_existe, medico_existe } = verificacion.recordset[0];
    if (!paciente_existe) throw new NotFoundException('Paciente no encontrado');
    if (!medico_existe) throw new NotFoundException('Médico no encontrado');

    const fechaConsulta = dto.fecha_consulta
      ? new Date(dto.fecha_consulta)
      : new Date();

    const ins = await pool
      .request()
      .input('id_paciente', sql.BigInt, dto.id_paciente)
      .input('id_medico', sql.BigInt, dto.id_medico)
      .input('fecha_consulta', sql.DateTime, fechaConsulta)
      .input('motivo_consulta', sql.NVarChar(1000), dto.motivo_consulta)
      .input('examen_fisico', sql.NVarChar(2000), dto.examen_fisico ?? null)
      .input(
        'plan_tratamiento',
        sql.NVarChar(2000),
        dto.plan_tratamiento ?? null,
      )
      .input('observaciones', sql.NVarChar(1000), dto.observaciones ?? null)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO ${TBL_CONSULTA}
          (id_paciente, id_medico, fecha_consulta, motivo_consulta, examen_fisico, plan_tratamiento, observaciones, created_by)
        OUTPUT INSERTED.id_consulta AS id_consulta
        VALUES
          (@id_paciente, @id_medico, @fecha_consulta, @motivo_consulta, @examen_fisico, @plan_tratamiento, @observaciones, @created_by);
      `);

    return { id_consulta: ins.recordset[0].id_consulta };
  }

  async getConsultasPaciente(idPaciente: number) {
    const pool = this.db.getPool();

    const r = await pool.request().input('id_paciente', sql.BigInt, idPaciente)
      .query(`
        SELECT 
          c.id_consulta, c.fecha_consulta, c.motivo_consulta,
          c.examen_fisico, c.plan_tratamiento, c.observaciones,
          c.created_at,
          -- Datos del médico
          m.nombres + ' ' + m.apellidos AS nombre_medico,
          m.numero_colegiatura,
          -- Signos vitales asociados
          sv.peso, sv.altura, sv.temperatura, sv.presion_sistolica, sv.presion_diastolica,
          sv.frecuencia_cardiaca, sv.frecuencia_respiratoria, sv.saturacion_oxigeno
        FROM ${TBL_CONSULTA} c
        INNER JOIN ${TBL_MEDICO} m ON c.id_medico = m.id_medico
        LEFT JOIN ${TBL_SIGNOS_VITALES} sv ON c.id_consulta = sv.id_consulta
        WHERE c.id_paciente = @id_paciente
        ORDER BY c.fecha_consulta DESC, c.created_at DESC;
      `);

    return r.recordset;
  }

  async getConsultaById(idConsulta: number) {
    const pool = this.db.getPool();

    const consulta = await pool
      .request()
      .input('id_consulta', sql.BigInt, idConsulta).query(`
        SELECT 
          c.id_consulta, c.id_paciente, c.id_medico,
          c.fecha_consulta, c.motivo_consulta, c.examen_fisico, 
          c.plan_tratamiento, c.observaciones, c.created_at,
          -- Datos del paciente
          p.nombres + ' ' + p.apellidos AS nombre_paciente,
          p.tipo_documento, p.numero_documento,
          -- Datos del médico
          m.nombres + ' ' + m.apellidos AS nombre_medico,
          m.numero_colegiatura
        FROM ${TBL_CONSULTA} c
        INNER JOIN ${TBL_PACIENTE} p ON c.id_paciente = p.id_paciente
        INNER JOIN ${TBL_MEDICO} m ON c.id_medico = m.id_medico
        WHERE c.id_consulta = @id_consulta;
      `);

    if (!consulta.recordset.length)
      throw new NotFoundException('Consulta no encontrada');

    // Obtener diagnósticos
    const diagnosticos = await pool
      .request()
      .input('id_consulta', sql.BigInt, idConsulta).query(`
        SELECT id_diagnostico, descripcion, codigo_cie10, tipo, observaciones, created_at
        FROM ${TBL_DIAGNOSTICO}
        WHERE id_consulta = @id_consulta
        ORDER BY created_at DESC;
      `);

    // Obtener evoluciones
    const evoluciones = await pool
      .request()
      .input('id_consulta', sql.BigInt, idConsulta).query(`
        SELECT id_evolucion, fecha_evolucion, descripcion, plan_seguimiento, estado, created_at
        FROM ${TBL_EVOLUCION}
        WHERE id_consulta = @id_consulta
        ORDER BY fecha_evolucion DESC, created_at DESC;
      `);

    return {
      ...consulta.recordset[0],
      diagnosticos: diagnosticos.recordset,
      evoluciones: evoluciones.recordset,
    };
  }

  // ==================== SIGNOS VITALES ====================

  async createSignosVitales(dto: CreateSignosVitalesDto, actorId?: number) {
    const pool = this.db.getPool();

    // Verificar que la consulta existe
    const check = await pool
      .request()
      .input('id_consulta', sql.BigInt, dto.id_consulta)
      .query(
        `SELECT id_consulta FROM ${TBL_CONSULTA} WHERE id_consulta = @id_consulta;`,
      );

    if (!check.recordset.length)
      throw new NotFoundException('Consulta no encontrada');

    // Eliminar signos vitales previos de esta consulta (solo un registro por consulta)
    await pool
      .request()
      .input('id_consulta', sql.BigInt, dto.id_consulta)
      .query(
        `DELETE FROM ${TBL_SIGNOS_VITALES} WHERE id_consulta = @id_consulta;`,
      );

    const ins = await pool
      .request()
      .input('id_consulta', sql.BigInt, dto.id_consulta)
      .input('peso', sql.Decimal(5, 2), dto.peso ?? null)
      .input('altura', sql.Decimal(5, 2), dto.altura ?? null)
      .input('temperatura', sql.Decimal(4, 1), dto.temperatura ?? null)
      .input('presion_sistolica', sql.Int, dto.presion_sistolica ?? null)
      .input('presion_diastolica', sql.Int, dto.presion_diastolica ?? null)
      .input('frecuencia_cardiaca', sql.Int, dto.frecuencia_cardiaca ?? null)
      .input(
        'frecuencia_respiratoria',
        sql.Int,
        dto.frecuencia_respiratoria ?? null,
      )
      .input('saturacion_oxigeno', sql.Int, dto.saturacion_oxigeno ?? null)
      .input('observaciones', sql.NVarChar(500), dto.observaciones ?? null)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO ${TBL_SIGNOS_VITALES}
          (id_consulta, peso, altura, temperatura, presion_sistolica, presion_diastolica,
           frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno, observaciones, created_by)
        OUTPUT INSERTED.id_signos_vitales AS id_signos_vitales
        VALUES
          (@id_consulta, @peso, @altura, @temperatura, @presion_sistolica, @presion_diastolica,
           @frecuencia_cardiaca, @frecuencia_respiratoria, @saturacion_oxigeno, @observaciones, @created_by);
      `);

    return { id_signos_vitales: ins.recordset[0].id_signos_vitales };
  }

  // ==================== DIAGNÓSTICOS ====================

  async createDiagnostico(dto: CreateDiagnosticoDto, actorId?: number) {
    const pool = this.db.getPool();

    // Verificar que la consulta existe
    const check = await pool
      .request()
      .input('id_consulta', sql.BigInt, dto.id_consulta)
      .query(
        `SELECT id_consulta FROM ${TBL_CONSULTA} WHERE id_consulta = @id_consulta;`,
      );

    if (!check.recordset.length)
      throw new NotFoundException('Consulta no encontrada');

    const ins = await pool
      .request()
      .input('id_consulta', sql.BigInt, dto.id_consulta)
      .input('descripcion', sql.NVarChar(500), dto.descripcion)
      .input('codigo_cie10', sql.NVarChar(20), dto.codigo_cie10 ?? null)
      .input('tipo', sql.NVarChar(20), dto.tipo ?? 'PRINCIPAL')
      .input('observaciones', sql.NVarChar(1000), dto.observaciones ?? null)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO ${TBL_DIAGNOSTICO}
          (id_consulta, descripcion, codigo_cie10, tipo, observaciones, created_by)
        OUTPUT INSERTED.id_diagnostico AS id_diagnostico
        VALUES
          (@id_consulta, @descripcion, @codigo_cie10, @tipo, @observaciones, @created_by);
      `);

    return { id_diagnostico: ins.recordset[0].id_diagnostico };
  }

  // ==================== ANTECEDENTES ====================

  async createAntecedente(dto: CreateAntecedenteDto, actorId?: number) {
    const pool = this.db.getPool();

    // Verificar que el paciente existe
    const check = await pool
      .request()
      .input('id_paciente', sql.BigInt, dto.id_paciente)
      .query(
        `SELECT id_paciente FROM ${TBL_PACIENTE} WHERE id_paciente = @id_paciente AND activo = 1;`,
      );

    if (!check.recordset.length)
      throw new NotFoundException('Paciente no encontrado');

    const ins = await pool
      .request()
      .input('id_paciente', sql.BigInt, dto.id_paciente)
      .input('tipo', sql.NVarChar(20), dto.tipo)
      .input('descripcion', sql.NVarChar(500), dto.descripcion)
      .input('observaciones', sql.NVarChar(1000), dto.observaciones ?? null)
      .input('fecha_estimada', sql.NVarChar(50), dto.fecha_estimada ?? null)
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO ${TBL_ANTECEDENTE}
          (id_paciente, tipo, descripcion, observaciones, fecha_estimada, created_by)
        OUTPUT INSERTED.id_antecedente AS id_antecedente
        VALUES
          (@id_paciente, @tipo, @descripcion, @observaciones, @fecha_estimada, @created_by);
      `);

    return { id_antecedente: ins.recordset[0].id_antecedente };
  }

  async getAntecedentesPaciente(idPaciente: number) {
    const pool = this.db.getPool();

    const r = await pool.request().input('id_paciente', sql.BigInt, idPaciente)
      .query(`
        SELECT id_antecedente, tipo, descripcion, observaciones, fecha_estimada, created_at
        FROM ${TBL_ANTECEDENTE}
        WHERE id_paciente = @id_paciente
        ORDER BY tipo, created_at DESC;
      `);

    return r.recordset;
  }

  // ==================== EVOLUCIONES ====================

  async createEvolucion(dto: CreateEvolucionDto, actorId?: number) {
    const pool = this.db.getPool();

    // Verificar que la consulta existe
    const check = await pool
      .request()
      .input('id_consulta', sql.BigInt, dto.id_consulta)
      .query(
        `SELECT id_consulta FROM ${TBL_CONSULTA} WHERE id_consulta = @id_consulta;`,
      );

    if (!check.recordset.length)
      throw new NotFoundException('Consulta no encontrada');

    const fechaEvolucion = dto.fecha_evolucion
      ? new Date(dto.fecha_evolucion)
      : new Date();

    const ins = await pool
      .request()
      .input('id_consulta', sql.BigInt, dto.id_consulta)
      .input('fecha_evolucion', sql.DateTime, fechaEvolucion)
      .input('descripcion', sql.NVarChar(2000), dto.descripcion)
      .input(
        'plan_seguimiento',
        sql.NVarChar(1000),
        dto.plan_seguimiento ?? null,
      )
      .input('estado', sql.NVarChar(20), dto.estado ?? 'SIN_CAMBIOS')
      .input('created_by', sql.BigInt, actorId ?? null).query(`
        INSERT INTO ${TBL_EVOLUCION}
          (id_consulta, fecha_evolucion, descripcion, plan_seguimiento, estado, created_by)
        OUTPUT INSERTED.id_evolucion AS id_evolucion
        VALUES
          (@id_consulta, @fecha_evolucion, @descripcion, @plan_seguimiento, @estado, @created_by);
      `);

    return { id_evolucion: ins.recordset[0].id_evolucion };
  }

  // ==================== FICHA COMPLETA ====================

  async getFichaPacienteCompleta(idPaciente: number) {
    const pool = this.db.getPool();

    // Datos del paciente
    const paciente = await pool
      .request()
      .input('id_paciente', sql.BigInt, idPaciente).query(`
        SELECT 
          id_paciente, tipo_documento, numero_documento,
          nombres, apellidos, fecha_nacimiento, sexo,
          telefono, email, direccion, activo, created_at
        FROM ${TBL_PACIENTE}
        WHERE id_paciente = @id_paciente;
      `);

    if (!paciente.recordset.length)
      throw new NotFoundException('Paciente no encontrado');

    // Antecedentes
    const antecedentes = await this.getAntecedentesPaciente(idPaciente);

    // Consultas
    const consultas = await this.getConsultasPaciente(idPaciente);

    return {
      paciente: paciente.recordset[0],
      antecedentes,
      consultas,
    };
  }
}
