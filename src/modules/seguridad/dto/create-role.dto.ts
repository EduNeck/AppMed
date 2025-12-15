import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString() codigo!: string;
  @IsString() nombre!: string;
  @IsOptional() @IsString() descripcion?: string;
}
