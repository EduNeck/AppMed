import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() activo?: boolean;
}
