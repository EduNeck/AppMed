import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';

export class SetUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  roleIds!: number[];
}
