import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Perms } from 'src/common/decorators/perms.decorator';
import { PermsGuard } from 'src/common/guards/perms.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { PacientesService } from './pacientes.service';

@UseGuards(JwtAuthGuard, PermsGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly srv: PacientesService) {}

  @Perms('PAC_VER')
  @Get()
  list(@Query('q') q?: string) {
    return this.srv.list(q);
  }

  @Perms('PAC_VER')
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.srv.getById(id);
  }

  @Perms('PAC_CREAR')
  @Post()
  create(@Body() dto: CreatePacienteDto, @Req() req: any) {
    return this.srv.create(dto, Number(req.user.sub));
  }

  @Perms('PAC_EDITAR')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePacienteDto,
    @Req() req: any,
  ) {
    return this.srv.update(id, dto, Number(req.user.sub));
  }
}
