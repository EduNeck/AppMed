import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Perms } from 'src/common/decorators/perms.decorator';
import { PermsGuard } from 'src/common/guards/perms.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetRolePermsDto } from './dto/set-role-perms.dto';
import { SetUserRolesDto } from './dto/set-user-roles.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SeguridadService } from './seguridad.service';

@UseGuards(JwtAuthGuard, PermsGuard)
@Controller('seguridad')
export class SeguridadController {
  constructor(private readonly seg: SeguridadService) {}

  // -------- Usuarios --------
  @Perms('SEG_USUARIOS_VER')
  @Get('usuarios')
  listUsers() {
    return this.seg.listUsers();
  }

  @Perms('SEG_USUARIOS_CREAR')
  @Post('usuarios')
  createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    return this.seg.createUser(dto, Number(req.user.sub));
  }

  @Perms('SEG_USUARIOS_EDITAR')
  @Put('usuarios/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    return this.seg.updateUser(id, dto, Number(req.user.sub));
  }

  @Perms('SEG_USUARIOS_EDITAR')
  @Put('usuarios/:id/password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @Req() req: any,
  ) {
    return this.seg.resetPassword(id, dto, Number(req.user.sub));
  }

  @Perms('SEG_USUARIOS_ROLES')
  @Put('usuarios/:id/roles')
  setUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUserRolesDto,
    @Req() req: any,
  ) {
    return this.seg.setUserRoles(id, dto, Number(req.user.sub));
  }

  @Perms('SEG_USUARIOS_VER')
  @Get('usuarios/:id/roles')
  getUserRoles(@Param('id', ParseIntPipe) id: number) {
    return this.seg.getUserRoles(id);
  }

  // -------- Roles --------
  @Perms('SEG_ROLES_VER')
  @Get('roles')
  listRoles() {
    return this.seg.listRoles();
  }

  @Perms('SEG_ROLES_EDITAR')
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto, @Req() req: any) {
    return this.seg.createRole(dto, Number(req.user.sub));
  }

  @Perms('SEG_ROLES_EDITAR')
  @Put('roles/:id')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
    @Req() req: any,
  ) {
    return this.seg.updateRole(id, dto, Number(req.user.sub));
  }

  @Perms('SEG_ROLES_VER')
  @Get('permisos')
  listPermisos() {
    return this.seg.listPermisos();
  }

  @Perms('SEG_ROLES_EDITAR')
  @Put('roles/:id/permisos')
  setRolePerms(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRolePermsDto,
  ) {
    return this.seg.setRolePerms(id, dto);
  }

  @Perms('SEG_ROLES_VER')
  @Get('roles/:id/permisos')
  getRolePerms(@Param('id', ParseIntPipe) id: number) {
    return this.seg.getRolePerms(id);
  }
}
