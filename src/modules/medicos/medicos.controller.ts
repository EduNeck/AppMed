import {
  Body,
  Controller,
  Delete,
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
import { CreateMedicoDto } from './dto/create-medico.dto';
import { SetMedicoEspecialidadesDto } from './dto/set-medico-especialidades.dto';
import { UpdateMedicoDto } from './dto/update-medico.dto';
import { MedicosService } from './medicos.service';

@UseGuards(JwtAuthGuard, PermsGuard)
@Controller('medicos')
export class MedicosController {
  constructor(private readonly srv: MedicosService) {}

  @Perms('MED_VER')
  @Get()
  list(@Query('q') q?: string) {
    return this.srv.list(q);
  }

  @Perms('MED_VER')
  @Get('especialidades')
  listEspecialidades() {
    return this.srv.listEspecialidades();
  }

  @Perms('MED_VER')
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.srv.getById(id);
  }

  @Perms('MED_CREAR')
  @Post()
  create(@Body() dto: CreateMedicoDto, @Req() req: any) {
    return this.srv.create(dto, Number(req.user.sub));
  }

  @Perms('MED_EDITAR')
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicoDto,
    @Req() req: any,
  ) {
    return this.srv.update(id, dto, Number(req.user.sub));
  }

  @Perms('MED_ELIMINAR')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.srv.delete(id, Number(req.user.sub));
  }

  @Perms('MED_EDITAR')
  @Put(':id/especialidades')
  setEspecialidades(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetMedicoEspecialidadesDto,
    @Req() req: any,
  ) {
    return this.srv.setEspecialidades(id, dto, Number(req.user.sub));
  }
}
