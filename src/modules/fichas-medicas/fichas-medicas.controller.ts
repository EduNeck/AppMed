import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Perms } from 'src/common/decorators/perms.decorator';
import { PermsGuard } from 'src/common/guards/perms.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { CreateAntecedenteDto } from './dto/create-antecedente.dto';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';
import { CreateEvolucionDto } from './dto/create-evolucion.dto';
import { CreateSignosVitalesDto } from './dto/create-signos-vitales.dto';
import { FichasMedicasService } from './fichas-medicas.service';

@UseGuards(JwtAuthGuard, PermsGuard)
@Controller('fichas-medicas')
export class FichasMedicasController {
  constructor(private readonly srv: FichasMedicasService) {}

  // ==================== CONSULTAS ====================

  @Perms('FICHA_CREAR')
  @Post('consultas')
  createConsulta(@Body() dto: CreateConsultaDto, @Req() req: any) {
    return this.srv.createConsulta(dto, Number(req.user.sub));
  }

  @Perms('FICHA_VER')
  @Get('pacientes/:id/consultas')
  getConsultasPaciente(@Param('id', ParseIntPipe) id: number) {
    return this.srv.getConsultasPaciente(id);
  }

  @Perms('FICHA_VER')
  @Get('consultas/:id')
  getConsultaById(@Param('id', ParseIntPipe) id: number) {
    return this.srv.getConsultaById(id);
  }

  // ==================== SIGNOS VITALES ====================

  @Perms('FICHA_CREAR')
  @Post('signos-vitales')
  createSignosVitales(@Body() dto: CreateSignosVitalesDto, @Req() req: any) {
    return this.srv.createSignosVitales(dto, Number(req.user.sub));
  }

  // ==================== DIAGNÓSTICOS ====================

  @Perms('FICHA_CREAR')
  @Post('diagnosticos')
  createDiagnostico(@Body() dto: CreateDiagnosticoDto, @Req() req: any) {
    return this.srv.createDiagnostico(dto, Number(req.user.sub));
  }

  // ==================== ANTECEDENTES ====================

  @Perms('FICHA_CREAR')
  @Post('antecedentes')
  createAntecedente(@Body() dto: CreateAntecedenteDto, @Req() req: any) {
    return this.srv.createAntecedente(dto, Number(req.user.sub));
  }

  @Perms('FICHA_VER')
  @Get('pacientes/:id/antecedentes')
  getAntecedentesPaciente(@Param('id', ParseIntPipe) id: number) {
    return this.srv.getAntecedentesPaciente(id);
  }

  // ==================== EVOLUCIONES ====================

  @Perms('FICHA_CREAR')
  @Post('evoluciones')
  createEvolucion(@Body() dto: CreateEvolucionDto, @Req() req: any) {
    return this.srv.createEvolucion(dto, Number(req.user.sub));
  }

  // ==================== FICHA COMPLETA ====================

  @Perms('FICHA_VER')
  @Get('pacientes/:id/ficha-completa')
  getFichaPacienteCompleta(@Param('id', ParseIntPipe) id: number) {
    return this.srv.getFichaPacienteCompleta(id);
  }
}
