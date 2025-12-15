import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';

export class SetRolePermsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  permIds!: number[];
}
